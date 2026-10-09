/**
 * LSP-style JSON-RPC 2.0 framing used by TypeScript 7.1 content mappers.
 *
 * TypeScript's ipc.JSONRPCProtocol reads and writes Content-Length headers
 * over STDIO (same base protocol as LSP). TypeScript is the client; the mapper
 * never initiates requests.
 *
 * @see tsc/internal/ipc/protocol_jsonrpc.go (typescript@7.1.0-dev.20261009.1)
 */
export const JSONRPC_VERSION = '2.0';

/**
 * @param {Record<string, unknown>} message
 * @returns {Buffer}
 */
export function encodeMessage(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');
  return Buffer.concat([header, body]);
}

/**
 * Incremental Content-Length reader for a duplex Node stream.
 */
export class JsonRpcReader {
  /** @param {NodeJS.ReadableStream} stream */
  constructor(stream) {
    this.stream = stream;
    /** @type {Buffer} */
    this.buf = Buffer.alloc(0);
  }

  /**
   * @returns {Promise<Record<string, unknown>>}
   */
  async read() {
    for (;;) {
      const parsed = this.#tryParse();
      if (parsed) return parsed;
      const chunk = await this.#readChunk();
      if (chunk === null) {
        throw new Error('JSON-RPC stream closed before a complete message arrived');
      }
      this.buf = Buffer.concat([this.buf, chunk]);
    }
  }

  /** @returns {Record<string, unknown> | null} */
  #tryParse() {
    const headerEnd = indexOfCrlfCrlf(this.buf);
    if (headerEnd < 0) return null;
    const header = this.buf.subarray(0, headerEnd).toString('utf8');
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      throw new Error(`JSON-RPC header missing Content-Length: ${header}`);
    }
    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    if (this.buf.length < bodyStart + length) return null;
    const body = this.buf.subarray(bodyStart, bodyStart + length);
    this.buf = this.buf.subarray(bodyStart + length);
    return JSON.parse(body.toString('utf8'));
  }

  /** @returns {Promise<Buffer | null>} */
  #readChunk() {
    return new Promise((resolve, reject) => {
      const onData = (chunk) => {
        cleanup();
        resolve(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      };
      const onEnd = () => {
        cleanup();
        resolve(null);
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        this.stream.off('data', onData);
        this.stream.off('end', onEnd);
        this.stream.off('error', onError);
      };
      this.stream.once('data', onData);
      this.stream.once('end', onEnd);
      this.stream.once('error', onError);
    });
  }
}

/** @param {Buffer} buf */
function indexOfCrlfCrlf(buf) {
  for (let i = 0; i + 3 < buf.length; i += 1) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) {
      return i;
    }
  }
  return -1;
}

/**
 * @param {NodeJS.WritableStream} stream
 * @param {Record<string, unknown>} message
 */
export function writeMessage(stream, message) {
  stream.write(encodeMessage(message));
}

/**
 * @param {string | number} id
 * @param {unknown} result
 */
export function success(id, result) {
  return { jsonrpc: JSONRPC_VERSION, id, result };
}

/**
 * @param {string | number} id
 * @param {number} code
 * @param {string} rpcMessage
 */
export function failure(id, code, rpcMessage) {
  return { jsonrpc: JSONRPC_VERSION, id, error: { code, message: rpcMessage } };
}
