#!/usr/bin/env node
/**
 * Reproducible Benchmark: ISO 8583 0100 JIT Card Authorization & 3-Way EOD Reconciliation
 * Compares:
 *   1. Zero-Allocation Byte-Slice ISO 8583 Bitmap Parser + Lock-Free FX Waterfall + 3-Way Hash-Indexed Recon
 *   2. Heap-Allocating Regex/JSON ISO 8583 Unmarshaler + Naive Nested-Scan EOD Reconciliation
 */
import { performance } from 'node:perf_hooks';
import os from 'node:os';

const AUTH_ITERATIONS = 20000;
const WARMUP = 2000;
const RECON_RECORDS = 10000;

/**
 * Construct a raw binary ISO 8583:1987 0100 Authorization Request packet:
 * - 4 bytes MTI ("0100")
 * - 8 bytes Primary Bitmap (DE 2, 3, 4, 11, 14, 22, 49, 51 set -> 0x70, 0x24, 0x04, 0x00, 0x00, 0x00, 0x80, 0x20)
 *   Wait: let's compute exact bit positions:
 *   Bit 2 (PAN, LLVAR): byte 0, mask 0x40
 *   Bit 3 (ProcCode, 6B): byte 0, mask 0x20
 *   Bit 4 (Amount, 12B): byte 0, mask 0x10
 *   Bit 11 (STAN, 6B): byte 1, mask 0x20
 *   Bit 49 (AcqCurrency, 3B): byte 6, mask 0x80
 *   Bit 51 (BillCurrency, 3B): byte 6, mask 0x20
 */
function buildRawIso8583Packet() {
  const mti = Buffer.from('0100', 'ascii');
  const bitmap = Buffer.from([0x70, 0x20, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x00]);
  const de2Pan = Buffer.from('164532015112830366', 'ascii'); // LLVAR: len 16 + 16-digit PAN
  const de3Proc = Buffer.from('000000', 'ascii'); // Purchase
  const de4Amt = Buffer.from('000000024950', 'ascii'); // 249.50 minor units
  const de11Stan = Buffer.from('849201', 'ascii'); // STAN
  const de49AcqCurr = Buffer.from('784', 'ascii'); // AED (ISO 4217)
  const de51BillCurr = Buffer.from('840', 'ascii'); // USD
  return Buffer.concat([mti, bitmap, de2Pan, de3Proc, de4Amt, de11Stan, de49AcqCurr, de51BillCurr]);
}

function parseAsciiUint(buf, offset, len) {
  let val = 0;
  for (let i = 0; i < len; i++) {
    val = val * 10 + (buf[offset + i] - 48);
  }
  return val;
}

/**
 * Zero-Allocation Slice-Indexed ISO 8583 Parser + Multi-Currency FX Waterfall
 */
const fxRatesMinorBps = new Int32Array(1000);
fxRatesMinorBps[784] = 2723; // 1 AED = 0.2723 USD (scaled 10,000)
fxRatesMinorBps[826] = 12650; // 1 GBP = 1.2650 USD
fxRatesMinorBps[978] = 10840; // 1 EUR = 1.0840 USD
fxRatesMinorBps[840] = 10000; // 1 USD = 1.0000 USD

const walletBalances = new Int32Array([
  0,     // 0: unused
  15000, // 1: AED wallet (150.00 AED - insufficient for 249.50 AED)
  95000, // 2: USD wallet (950.00 USD - sufficient via JIT FX waterfall)
  40000  // 3: EUR wallet
]);

function zeroAllocIso8583JitAuth(packet, outScratch) {
  // Verify MTI == "0100"
  if (packet[0] !== 48 || packet[1] !== 49 || packet[2] !== 48 || packet[3] !== 48) {
    return 0;
  }
  const b0 = packet[4];
  const b1 = packet[5];
  const b6 = packet[10];
  let cursor = 12;

  // DE 2: LLVAR PAN
  let panLen = 0;
  if (b0 & 0x40) {
    panLen = (packet[cursor] - 48) * 10 + (packet[cursor + 1] - 48);
    cursor += 2 + panLen;
  }
  // DE 3: Processing Code (6 bytes)
  if (b0 & 0x20) {
    cursor += 6;
  }
  // DE 4: Transaction Amount in minor units (12 bytes)
  let amountMinor = 0;
  if (b0 & 0x10) {
    amountMinor = parseAsciiUint(packet, cursor, 12);
    cursor += 12;
  }
  // DE 11: STAN (6 bytes)
  let stan = 0;
  if (b1 & 0x20) {
    stan = parseAsciiUint(packet, cursor, 6);
    cursor += 6;
  }
  // DE 49: Acquiring Currency (3 bytes)
  let acqCurr = 840;
  if (b6 & 0x80) {
    acqCurr = parseAsciiUint(packet, cursor, 3);
    cursor += 3;
  }
  // DE 51: Cardholder Billing Currency (3 bytes)
  let billCurr = 840;
  if (b6 & 0x20) {
    billCurr = parseAsciiUint(packet, cursor, 3);
    cursor += 3;
  }

  // JIT Multi-Currency Waterfall:
  // Step 1: Check native currency pocket (AED = pocket 1)
  if (walletBalances[1] >= amountMinor) {
    outScratch[0] = 1; // Approved from native pocket
    outScratch[1] = amountMinor;
    outScratch[2] = stan;
    return 1;
  }
  // Step 2: Convert to USD base pocket (pocket 2) with 35 bps FX spread
  const rate = fxRatesMinorBps[acqCurr];
  const usdEquivMinor = Math.trunc((amountMinor * rate * 10035) / 100000000);
  if (walletBalances[2] >= usdEquivMinor) {
    outScratch[0] = 2; // Approved via JIT FX waterfall
    outScratch[1] = usdEquivMinor;
    outScratch[2] = stan;
    return 1;
  }
  return 0;
}

/**
 * Heap-Allocating Map/JSON ISO 8583 Unmarshaler + String Currency Formatting
 */
function heapAllocIso8583JitAuth(packet) {
  const str = packet.toString('ascii');
  const mti = str.slice(0, 4);
  const bitmap = Buffer.from(packet.subarray(4, 12));
  const fields = new Map();
  let cursor = 12;
  if (bitmap[0] & 0x40) {
    const len = parseInt(str.slice(cursor, cursor + 2), 10);
    fields.set(2, str.slice(cursor + 2, cursor + 2 + len));
    cursor += 2 + len;
  }
  if (bitmap[0] & 0x20) {
    fields.set(3, str.slice(cursor, cursor + 6));
    cursor += 6;
  }
  if (bitmap[0] & 0x10) {
    fields.set(4, parseInt(str.slice(cursor, cursor + 12), 10));
    cursor += 12;
  }
  if (bitmap[1] & 0x20) {
    fields.set(11, str.slice(cursor, cursor + 6));
    cursor += 6;
  }
  if (bitmap[6] & 0x80) {
    fields.set(49, str.slice(cursor, cursor + 3));
    cursor += 3;
  }
  if (bitmap[6] & 0x20) {
    fields.set(51, str.slice(cursor, cursor + 3));
    cursor += 3;
  }
  const serialized = JSON.parse(JSON.stringify(Object.fromEntries(fields)));
  const amt = Number(serialized['4']);
  const rate = serialized['49'] === '784' ? 0.2723 : 1.0;
  const usdMinor = Math.round(amt * rate * 1.0035);
  return { mti, approved: usdMinor <= 95000, usdMinor, stan: serialized['11'] };
}

function percentile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function runBenchmarks() {
  const packet = buildRawIso8583Packet();
  const scratch = new Int32Array(4);

  for (let i = 0; i < WARMUP; i++) {
    zeroAllocIso8583JitAuth(packet, scratch);
    heapAllocIso8583JitAuth(packet);
  }

  const zeroAllocUs = [];
  for (let i = 0; i < AUTH_ITERATIONS; i++) {
    const t0 = performance.now();
    zeroAllocIso8583JitAuth(packet, scratch);
    const t1 = performance.now();
    zeroAllocUs.push((t1 - t0) * 1000);
  }

  const heapAllocUs = [];
  for (let i = 0; i < AUTH_ITERATIONS; i++) {
    const t0 = performance.now();
    heapAllocIso8583JitAuth(packet);
    const t1 = performance.now();
    heapAllocUs.push((t1 - t0) * 1000);
  }

  zeroAllocUs.sort((a, b) => a - b);
  heapAllocUs.sort((a, b) => a - b);

  // 3-Way EOD Reconciliation Benchmark (10,000 Clearing Records: Internal Ledger vs Processor Auth Log vs Scheme EP747)
  const internalLedger = [];
  const processorLog = [];
  const schemeClearing = [];

  for (let i = 0; i < RECON_RECORDS; i++) {
    const stan = `STAN-${100000 + i}`;
    const amt = 1000 + (i % 5000);
    internalLedger.push({ stan, amountMinor: amt, status: 'CAPTURED' });
    // Inject 1.2% FX drift (within 5 minor units tolerance) and 0.3% force-post anomalies
    const drift = i % 83 === 0 ? 3 : 0;
    const missingAuth = i % 333 === 0;
    if (!missingAuth) {
      processorLog.push({ stan, amountMinor: amt });
    }
    schemeClearing.push({ stan, settledMinor: amt + drift, forcePost: missingAuth });
  }

  // Hash-Indexed 3-Way Join with FX Drift Tolerance Window
  const tRecon0 = performance.now();
  const ledgerMap = new Map();
  for (let i = 0; i < internalLedger.length; i++) {
    ledgerMap.set(internalLedger[i].stan, internalLedger[i].amountMinor);
  }
  const procMap = new Map();
  for (let i = 0; i < processorLog.length; i++) {
    procMap.set(processorLog[i].stan, processorLog[i].amountMinor);
  }

  let exactMatches = 0;
  let fxDriftAutoResolved = 0;
  let forcePostExceptions = 0;

  for (let i = 0; i < schemeClearing.length; i++) {
    const row = schemeClearing[i];
    const ledgerAmt = ledgerMap.get(row.stan);
    const procAmt = procMap.get(row.stan);
    if (procAmt === undefined || ledgerAmt === undefined) {
      forcePostExceptions++;
    } else if (row.settledMinor === ledgerAmt && ledgerAmt === procAmt) {
      exactMatches++;
    } else if (Math.abs(row.settledMinor - ledgerAmt) <= 5) {
      fxDriftAutoResolved++;
    } else {
      forcePostExceptions++;
    }
  }
  const hashReconMs = performance.now() - tRecon0;

  // Naive Nested Scan (10,000 records across 3 unindexed tables)
  const tNaive0 = performance.now();
  let naiveMatches = 0;
  const sampleSubset = 1500; // Measure 1,500 and project or measure directly
  for (let i = 0; i < sampleSubset; i++) {
    const row = schemeClearing[i];
    const l = internalLedger.find((x) => x.stan === row.stan);
    const p = processorLog.find((x) => x.stan === row.stan);
    if (l && p) naiveMatches++;
  }
  const naiveReconSampleMs = performance.now() - tNaive0;
  const naiveReconProjected10kMs = naiveReconSampleMs * ((RECON_RECORDS / sampleSubset) ** 2);

  console.log(
    JSON.stringify(
      {
        environment: {
          node: process.version,
          platform: `${os.platform()}/${os.arch()}`,
          cpu: os.cpus()[0]?.model || 'unknown'
        },
        iso8583JitAuthIterations: AUTH_ITERATIONS,
        zeroAllocParserUs: {
          p50: Number(percentile(zeroAllocUs, 50).toFixed(2)),
          p95: Number(percentile(zeroAllocUs, 95).toFixed(2)),
          p99: Number(percentile(zeroAllocUs, 99).toFixed(2))
        },
        heapAllocParserUs: {
          p50: Number(percentile(heapAllocUs, 50).toFixed(2)),
          p95: Number(percentile(heapAllocUs, 95).toFixed(2)),
          p99: Number(percentile(heapAllocUs, 99).toFixed(2))
        },
        parserSpeedupP50: Number((percentile(heapAllocUs, 50) / Math.max(0.05, percentile(zeroAllocUs, 50))).toFixed(1)),
        threeWayReconciliation10k: {
          records: RECON_RECORDS,
          hashIndexed3WayJoinMs: Number(hashReconMs.toFixed(2)),
          naiveNestedScan10kProjectedMs: Number(naiveReconProjected10kMs.toFixed(1)),
          exactMatches,
          fxDriftAutoResolved,
          forcePostExceptions
        }
      },
      null,
      2
    )
  );
}

runBenchmarks();
