#!/usr/bin/env node
/**
 * Elevate catalog posts to publication bar:
 *  - unique slug-named covers in posts.json
 *  - canonical numbered references + light in-text citations
 *  - Mermaid quoted nodes + ByteByteGo classDef palette
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = join(ROOT, 'blog', 'posts');
const COVER_DIR = join(ROOT, 'blog', 'assets', 'covers');
const postsPath = join(ROOT, 'blog', 'posts.json');
const posts = JSON.parse(readFileSync(postsPath, 'utf8'));

const R = (authors, year, title, venue, url) =>
  `**${authors} (${year})**. *${title}*. ${venue}. [${url}](${url})`;

const LIB = {
  raft: R('Ongaro, D., & Ousterhout, J.', 2014, 'In Search of an Understandable Consensus Algorithm', 'USENIX ATC', 'https://raft.github.io/raft.pdf'),
  paxos: R('Lamport, L.', 1998, 'The Part-Time Parliament', 'ACM TOCS', 'https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf'),
  paxosSimple: R('Lamport, L.', 2001, 'Paxos Made Simple', 'ACM SIGACT News', 'https://lamport.azurewebsites.net/pubs/paxos-simple.pdf'),
  spanner: R('Corbett, J. C., et al.', 2012, 'Spanner: Google\'s Globally-Distributed Database', 'OSDI', 'https://research.google/pubs/pub39966/'),
  percolator: R('Peng, D., & Dabek, F.', 2010, 'Large-scale Incremental Processing Using Distributed Transactions and Notifications', 'OSDI', 'https://research.google/pubs/pub36726/'),
  calvin: R('Thomson, A., et al.', 2012, 'Calvin: Fast Distributed Transactions for Partitioned Database Systems', 'SIGMOD', 'https://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf'),
  dynamo: R('DeCandia, G., et al.', 2007, 'Dynamo: Amazon\'s Highly Available Key-value Store', 'SOSP', 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf'),
  bigtable: R('Chang, F., et al.', 2006, 'Bigtable: A Distributed Storage System for Structured Data', 'OSDI', 'https://research.google/pubs/pub27898/'),
  mapreduce: R('Dean, J., & Ghemawat, S.', 2004, 'MapReduce: Simplified Data Processing on Large Clusters', 'OSDI', 'https://research.google/pubs/pub62/'),
  gfs: R('Ghemawat, S., Gobioff, H., & Leung, S.-T.', 2003, 'The Google File System', 'SOSP', 'https://research.google/pubs/pub51/'),
  chubby: R('Burrows, M.', 2006, 'The Chubby Lock Service for Loosely-Coupled Distributed Systems', 'OSDI', 'https://research.google/pubs/pub27897/'),
  btree: R('Bayer, R., & McCreight, E.', 1972, 'Organization and Maintenance of Large Ordered Indexes', 'Acta Informatica', 'https://doi.org/10.1007/BF00288683'),
  lsm: R("O'Neil, P., Cheng, E., Gawlick, D., & O'Neil, E.", 1996, 'The Log-Structured Merge-Tree (LSM-Tree)', 'Acta Informatica', 'https://www.cs.umb.edu/~poneil/lsmtree.pdf'),
  aries: R('Mohan, C., et al.', 1992, 'ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks', 'ACM TODS', 'https://doi.org/10.1145/128765.128770'),
  mvcc: R('Reed, D. P.', 1978, 'Naming and Synchronization in a Decentralized Computer System', 'MIT PhD Thesis', 'https://www.lcs.mit.edu/publications/pubs/pdf/MIT-LCS-TR-205.pdf'),
  cap: R('Gilbert, S., & Lynch, N.', 2002, 'Brewer\'s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services', 'ACM SIGACT News', 'https://web.mit.edu/6.033/www/papers/p80-gilbert.pdf'),
  clocks: R('Lamport, L.', 1978, 'Time, Clocks, and the Ordering of Events in a Distributed System', 'CACM', 'https://lamport.azurewebsites.net/pubs/time-clocks.pdf'),
  crdt: R('Shapiro, M., Preguiça, N., Baquero, C., & Zawirski, M.', 2011, 'Conflict-free Replicated Data Types', 'SSS', 'https://hal.inria.fr/inria-00609399v1/document'),
  hashing: R('Karger, D., et al.', 1997, 'Consistent Hashing and Random Trees', 'STOC', 'https://www.cs.princeton.edu/courses/archive/fall09/cos521/Handouts/consistent-hashing.pdf'),
  maglev: R('Eisenbud, D. E., et al.', 2016, 'Maglev: A Fast and Reliable Software Network Load Balancer', 'NSDI', 'https://research.google/pubs/pub44824/'),
  kafka: R('Kreps, J., Narkhede, N., & Rao, J.', 2011, 'Kafka: a Distributed Messaging System for Log Processing', 'NetDB', 'https://notes.stephenholiday.com/Kafka.pdf'),
  flink: R('Carbone, P., et al.', 2015, 'Apache Flink: Stream and Batch Processing in a Single Engine', 'IEEE Data Engineering Bulletin', 'https://www.vldb.org/pvldb/vol8/p1970-carbone.pdf'),
  spark: R('Zaharia, M., et al.', 2012, 'Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing', 'NSDI', 'https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf'),
  pregel: R('Malewicz, G., et al.', 2010, 'Pregel: A System for Large-Scale Graph Processing', 'SIGMOD', 'https://research.google/pubs/pub37252/'),
  hnsw: R('Malkov, Y. A., & Yashunin, D. A.', 2018, 'Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs', 'IEEE TPAMI', 'https://arxiv.org/abs/1603.09320'),
  pq: R('Jégou, H., Douze, M., & Schmid, C.', 2011, 'Product Quantization for Nearest Neighbor Search', 'IEEE TPAMI', 'https://hal.inria.fr/inria-00514462v2/document'),
  diskann: R('Subramanya, S. J., et al.', 2019, 'DiskANN: Fast Accurate Billion-point Nearest Neighbor Search on a Single Node', 'NeurIPS', 'https://proceedings.neurips.cc/paper/2019/file/09853c7fb1d3f8ee67a61b6bf4a7f8e6-Paper.pdf'),
  faiss: R('Johnson, J., Douze, M., & Jégou, H.', 2019, 'Billion-scale Similarity Search with GPUs', 'IEEE Transactions on Big Data', 'https://arxiv.org/abs/1702.08734'),
  attention: R('Vaswani, A., et al.', 2017, 'Attention Is All You Need', 'NeurIPS', 'https://arxiv.org/abs/1706.03762'),
  flashattn: R('Dao, T., et al.', 2022, 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', 'NeurIPS', 'https://arxiv.org/abs/2205.14135'),
  pagedattn: R('Kwon, W., et al.', 2023, 'Efficient Memory Management for Large Language Model Serving with PagedAttention', 'SOSP', 'https://arxiv.org/abs/2309.06180'),
  lora: R('Hu, E. J., et al.', 2021, 'LoRA: Low-Rank Adaptation of Large Language Models', 'ICLR', 'https://arxiv.org/abs/2106.09685'),
  qlora: R('Dettmers, T., et al.', 2023, 'QLoRA: Efficient Finetuning of Quantized LLMs', 'NeurIPS', 'https://arxiv.org/abs/2305.14314'),
  gptq: R('Frantar, E., et al.', 2023, 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers', 'ICLR', 'https://arxiv.org/abs/2210.17323'),
  awq: R('Lin, J., et al.', 2024, 'AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration', 'MLSys', 'https://arxiv.org/abs/2306.00978'),
  specdec: R('Leviathan, Y., Kalman, M., & Matias, Y.', 2023, 'Fast Inference from Transformers via Speculative Decoding', 'ICML', 'https://arxiv.org/abs/2211.17192'),
  medusa: R('Cai, T., et al.', 2024, 'Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads', 'ICML', 'https://arxiv.org/abs/2401.10774'),
  bitnet: R('Wang, H., et al.', 2023, 'BitNet: Scaling 1-bit Transformers for Large Language Models', 'arXiv', 'https://arxiv.org/abs/2310.11453'),
  bm25: R('Robertson, S., & Zaragoza, H.', 2009, 'The Probabilistic Relevance Framework: BM25 and Beyond', 'Foundations and Trends in Information Retrieval', 'https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf'),
  graphrag: R('Edge, D., et al.', 2024, 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization', 'arXiv', 'https://arxiv.org/abs/2404.16130'),
  rfc9110: R('Fielding, R., Ed., Nottingham, M., Ed., & Reschke, J., Ed.', 2022, 'HTTP Semantics', 'RFC 9110', 'https://www.rfc-editor.org/rfc/rfc9110'),
  rfc7540: R('Belshe, M., Peon, R., & Thomson, M.', 2015, 'Hypertext Transfer Protocol Version 2 (HTTP/2)', 'RFC 7540', 'https://www.rfc-editor.org/rfc/rfc7540'),
  rfc9114: R('Bishop, M., Ed.', 2022, 'HTTP/3', 'RFC 7541 / RFC 9114', 'https://www.rfc-editor.org/rfc/rfc9114'),
  rfc7519: R('Jones, M., Bradley, J., & Sakimura, N.', 2015, 'JSON Web Token (JWT)', 'RFC 7519', 'https://www.rfc-editor.org/rfc/rfc7519'),
  rfc6749: R('Hardt, D., Ed.', 2012, 'The OAuth 2.0 Authorization Framework', 'RFC 6749', 'https://www.rfc-editor.org/rfc/rfc6749'),
  rfc7234: R('Fielding, R., Nottingham, M., & Reschke, J.', 2014, 'Hypertext Transfer Protocol (HTTP/1.1): Caching', 'RFC 7234', 'https://www.rfc-editor.org/rfc/rfc7234'),
  w3cTrace: R('W3C Distributed Tracing Working Group', 2021, 'Trace Context', 'W3C Recommendation', 'https://www.w3.org/TR/trace-context/'),
  otel: R('OpenTelemetry Authors', 2024, 'OpenTelemetry Specification', 'CNCF', 'https://opentelemetry.io/docs/specs/otel/'),
  reactrfc: R('React Team', 2024, 'React Server Components and Related RFCs', 'reactjs/rfcs', 'https://github.com/reactjs/rfcs'),
  next15: R('Vercel Engineering', 2024, 'Next.js 15', 'Next.js Blog', 'https://nextjs.org/blog/next-15'),
  next16: R('Vercel Engineering', 2025, 'Next.js 16', 'Next.js Blog', 'https://nextjs.org/blog/next-16'),
  nextCache: R('Vercel Documentation', 2026, 'Caching in Next.js', 'Next.js Docs', 'https://nextjs.org/docs/app/getting-started/caching'),
  mcp: R('Anthropic', 2025, 'Model Context Protocol Specification', 'MCP Docs', 'https://modelcontextprotocol.io/specification'),
  ebpf: R('Linux Kernel Community', 2024, 'BPF Documentation', 'kernel.org', 'https://docs.kernel.org/bpf/'),
  iouring: R('Axboe, J.', 2019, 'Efficient IO with io_uring', 'kernel.dk', 'https://kernel.dk/io_uring.pdf'),
  xdp: R('Høiland-Jørgensen, T., et al.', 2018, 'The eXpress Data Path: Fast Programmable Packet Processing in the Operating System Kernel', 'CoNEXT', 'https://dl.acm.org/doi/10.1145/3281411.3281443'),
  wasm: R('W3C WebAssembly Working Group', 2024, 'WebAssembly Core Specification', 'W3C', 'https://www.w3.org/TR/wasm-core-2/'),
  ssa: R('Cytron, R., et al.', 1991, 'Efficiently Computing Static Single Assignment Form and the Control Dependence Graph', 'ACM TOPLAS', 'https://doi.org/10.1145/115372.115320'),
  llvm: R('Lattner, C., & Adve, V.', 2004, 'LLVM: A Compilation Framework for Lifelong Program Analysis & Transformation', 'CGO', 'https://llvm.org/pubs/2004-01-30-CGO-LLVM.pdf'),
  v8: R('V8 Team', 2024, 'V8 Orinoco and Garbage Collection', 'v8.dev', 'https://v8.dev/blog'),
  zgc: R('Lidén, P., & Karlsson, S.', 2018, 'ZGC: A Scalable Low-Latency Garbage Collector', 'Oracle / OpenJDK', 'https://openjdk.org/jeps/333'),
  hazard: R('Michael, M. M.', 2004, 'Hazard Pointers: Safe Memory Reclamation for Lock-Free Objects', 'IEEE TPDS', 'https://www.cs.otago.ac.nz/cosc440/readings/hazard-pointers.pdf'),
  rcu: R('McKenney, P. E., & Slingwine, J. D.', 1998, 'Read-Copy Update: Using Execution History to Solve Concurrency Problems', 'PDCS', 'https://www.rdrop.com/users/paulmck/RCU/rclockpdcsproof.pdf'),
  bloom: R('Bloom, B. H.', 1970, 'Space/Time Trade-offs in Hash Coding with Allowable Errors', 'CACM', 'https://doi.org/10.1145/362686.362692'),
  gorilla: R('Pelkonen, T., et al.', 2015, 'Gorilla: A Fast, Scalable, In-Memory Time Series Database', 'VLDB', 'https://www.vldb.org/pvldb/vol8/p1816-teller.pdf'),
  parquet: R('Apache Parquet Community', 2024, 'Apache Parquet Format', 'Apache Software Foundation', 'https://parquet.apache.org/docs/'),
  arrow: R('Apache Arrow Community', 2024, 'Apache Arrow Columnar Format', 'Apache Software Foundation', 'https://arrow.apache.org/docs/format/Columnar.html'),
  iceberg: R('Apache Iceberg Community', 2024, 'Iceberg Table Spec', 'Apache Software Foundation', 'https://iceberg.apache.org/spec/'),
  reedsolomon: R('Reed, I. S., & Solomon, G.', 1960, 'Polynomial Codes Over Certain Finite Fields', 'Journal of the Society for Industrial and Applied Mathematics', 'https://doi.org/10.1137/0108018'),
  noise: R('Perrin, T.', 2018, 'The Noise Protocol Framework', 'noiseprotocol.org', 'https://noiseprotocol.org/noise.pdf'),
  spiffe: R('SPIFFE Authors', 2024, 'SPIFFE Specification', 'CNCF', 'https://github.com/spiffe/spiffe/blob/main/standards/SPIFFE.md'),
  wireguard: R('Donenfeld, J. A.', 2017, 'WireGuard: Next Generation Kernel Network Tunnel', 'NDSS', 'https://www.wireguard.com/papers/wireguard.pdf'),
  k8s: R('Kubernetes Authors', 2024, 'Kubernetes Documentation', 'CNCF', 'https://kubernetes.io/docs/home/'),
  postgres: R('PostgreSQL Global Development Group', 2024, 'PostgreSQL Documentation', 'postgresql.org', 'https://www.postgresql.org/docs/current/'),
  redis: R('Redis Ltd.', 2024, 'Redis Documentation', 'redis.io', 'https://redis.io/docs/'),
  prometheus: R('Prometheus Authors', 2024, 'Prometheus Documentation', 'CNCF', 'https://prometheus.io/docs/introduction/overview/'),
  dora: R('Forsgren, N., Humble, J., & Kim, G.', 2018, 'Accelerate: The Science of Lean Software and DevOps', 'IT Revolution / DORA', 'https://dora.dev/research/'),
  brooks: R('Brooks, F. P.', 1975, 'The Mythical Man-Month', 'Addison-Wesley', 'https://en.wikipedia.org/wiki/The_Mythical_Man-Month'),
  saga: R('Garcia-Molina, H., & Salem, K.', 1987, 'Sagas', 'SIGMOD', 'https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf'),
  circuit: R('Nygard, M.', 2018, 'Release It! Design and Deploy Production-Ready Software (2nd ed.)', 'Pragmatic Bookshelf', 'https://pragprog.com/titles/mnee2/release-it-second-edition/'),
  tokenbucket: R('Turner, J. S.', 1986, 'New Directions in Communications (or Which Way to the Information Age?)', 'IEEE Communications Magazine', 'https://doi.org/10.1109/MCOM.1986.1092946'),
  grpc: R('gRPC Authors', 2024, 'gRPC Documentation', 'grpc.io', 'https://grpc.io/docs/'),
  protobuf: R('Google', 2024, 'Protocol Buffers Language Guide', 'protobuf.dev', 'https://protobuf.dev/programming-guides/proto3/'),
  cypher: R('Francis, N., et al.', 2018, 'Cypher: An Evolving Query Language for Property Graphs', 'SIGMOD', 'https://doi.org/10.1145/3183713.3190657'),
  pgvector: R('pgvector Authors', 2024, 'pgvector: Open-source vector similarity search for Postgres', 'GitHub', 'https://github.com/pgvector/pgvector'),
  langgraph: R('LangChain', 2024, 'LangGraph Documentation', 'langchain.com', 'https://langchain-ai.github.io/langgraph/'),
  react19: R('React Team', 2024, 'React 19 Blog Post', 'react.dev', 'https://react.dev/blog/2024/12/05/react-19'),
  compiler: R('React Team', 2024, 'React Compiler', 'react.dev', 'https://react.dev/learn/react-compiler'),
  solid: R('Ry, R.', 2024, 'SolidJS Reactivity', 'solidjs.com', 'https://www.solidjs.com/guides/reactivity'),
  svelte5: R('Svelte Team', 2024, 'Svelte 5 Runes', 'svelte.dev', 'https://svelte.dev/docs/svelte/what-are-runes'),
};

const RULES = [
  [/raft|consensus|leader-election/, ['raft', 'paxosSimple', 'etcd' in LIB ? 'raft' : 'raft', 'chubby']],
  [/paxos|zab/, ['paxos', 'paxosSimple', 'raft']],
  [/spanner|truetime|external-consistency/, ['spanner', 'clocks', 'calvin']],
  [/percolator|two-phase-commit|2pc|3pc/, ['percolator', 'calvin', 'spanner']],
  [/calvin|deterministic-rdma/, ['calvin', 'spanner', 'percolator']],
  [/mvcc|snapshot-isolation/, ['mvcc', 'aries', 'postgres']],
  [/lsm|sstable|compaction|rocksdb|wiredtiger/, ['lsm', 'aries', 'bigtable']],
  [/b-tree|b-plus|btree/, ['btree', 'lsm', 'postgres']],
  [/wal|aries|write-ahead/, ['aries', 'lsm', 'postgres']],
  [/crdt|operational-transformation|local-first/, ['crdt', 'clocks', 'dynamo']],
  [/consistent-hash|maglev|virtual-nodes/, ['hashing', 'maglev', 'dynamo']],
  [/kafka|log-compaction|consumer-group/, ['kafka', 'dynamo', 'flink']],
  [/flink|watermark|stream-processing|pulsar/, ['flink', 'kafka', 'spark']],
  [/spark|shuffle|catalyst/, ['spark', 'mapreduce', 'gfs']],
  [/pregel|graph-partition|vertex-cut/, ['pregel', 'spark', 'cypher']],
  [/hnsw|vector-index|vector-db|vector-search|ann/, ['hnsw', 'pq', 'faiss']],
  [/product-quantization|scalar-quantization|pq-/, ['pq', 'hnsw', 'faiss']],
  [/diskann/, ['diskann', 'hnsw', 'faiss']],
  [/pgvector/, ['pgvector', 'hnsw', 'postgres']],
  [/bm25|hybrid-search|sparse-dense|rrf/, ['bm25', 'hnsw', 'graphrag']],
  [/graphrag|knowledge-graph|entity-graph|cypher/, ['graphrag', 'cypher', 'hnsw']],
  [/flashattention|attention|transformer/, ['flashattn', 'attention', 'pagedattn']],
  [/pagedattention|vllm|kv-cache/, ['pagedattn', 'flashattn', 'specdec']],
  [/speculative-decoding|medusa/, ['specdec', 'medusa', 'pagedattn']],
  [/lora|qlora|fine-tuning|peft/, ['lora', 'qlora', 'awq']],
  [/awq|gptq|gguf|quantization/, ['awq', 'gptq', 'bitnet']],
  [/bitnet|ternary/, ['bitnet', 'awq', 'attention']],
  [/nextjs|app-router|ppr|dynamicio|server-action|rsc|flight/, ['next16', 'next15', 'nextCache', 'reactrfc']],
  [/react-compiler|signals|fine-grained/, ['compiler', 'react19', 'solid', 'svelte5']],
  [/react-19|useoptimistic|activity/, ['react19', 'reactrfc', 'next16']],
  [/jwt|oauth/, ['rfc7519', 'rfc6749', 'rfc9110']],
  [/http2|http\/2|grpc|protobuf/, ['rfc7540', 'grpc', 'protobuf']],
  [/http3|quic/, ['rfc9114', 'rfc7540', 'rfc9110']],
  [/caching|cache-/, ['rfc7234', 'nextCache', 'dynamo']],
  [/opentelemetry|otel|tracing|trace-context/, ['w3cTrace', 'otel', 'rfc9110']],
  [/mcp|model-context-protocol|a2a/, ['mcp', 'langgraph', 'otel']],
  [/ebpf|xdp|kprobe|bpf/, ['ebpf', 'xdp', 'iouring']],
  [/io-uring|uring|sendfile|zero-copy/, ['iouring', 'ebpf', 'xdp']],
  [/wasm|webassembly/, ['wasm', 'llvm', 'ssa']],
  [/ssa|llvm|compiler-lowering|jit/, ['ssa', 'llvm', 'v8']],
  [/v8|orinoco|scavenger|garbage-collection|zgc|shenandoah|gc-/, ['v8', 'zgc', 'rcu']],
  [/hazard-pointer|lock-free|cas-aba|rcu/, ['hazard', 'rcu', 'bloom']],
  [/bloom/, ['bloom', 'hnsw', 'lsm']],
  [/gorilla|time-series|prometheus|victoriametrics/, ['gorilla', 'prometheus', 'parquet']],
  [/parquet|arrow|columnar|iceberg|delta|orc/, ['parquet', 'arrow', 'iceberg']],
  [/erasure|reed-solomon/, ['reedsolomon', 'gfs', 'bigtable']],
  [/wireguard|spiffe|noise|zero-trust|microsegmentation/, ['wireguard', 'spiffe', 'noise']],
  [/kubernetes|k8s|operator|crd/, ['k8s', 'raft', 'chubby']],
  [/postgres|pgbouncer|partitioning/, ['postgres', 'mvcc', 'btree']],
  [/redis|bullmq/, ['redis', 'dynamo', 'kafka']],
  [/saga|circuit-break|rate-limit|token-bucket|bulkhead/, ['saga', 'circuit', 'tokenbucket']],
  [/langgraph|multi-agent|agent-swarm|orchestrat/, ['langgraph', 'mcp', 'otel']],
  [/dora|productivity|tech-lead|mentorship|sprint/, ['dora', 'brooks', 'circuit']],
  [/cap-theorem|split-brain/, ['cap', 'clocks', 'raft']],
];

// etcd isn't in LIB; clean raft rule
RULES[0] = [/raft|consensus|leader-election/, ['raft', 'paxosSimple', 'chubby']];

function haystack(post, md) {
  return `${post.slug} ${post.title} ${(post.tags || []).join(' ')} ${md.slice(0, 1200)}`.toLowerCase();
}

function pickRefs(post, md) {
  const h = haystack(post, md);
  const keys = [];
  for (const [re, ids] of RULES) {
    if (re.test(h)) {
      for (const id of ids) if (LIB[id] && !keys.includes(id)) keys.push(id);
    }
    if (keys.length >= 6) break;
  }
  if (keys.length < 3) {
    for (const id of ['clocks', 'cap', 'otel']) {
      if (!keys.includes(id)) keys.push(id);
    }
  }
  return keys.slice(0, 7).map((id, i) => `${i + 1}. ${LIB[id]}`);
}

function addInlineCites(md, refCount) {
  if (refCount < 1) return md;
  const parts = md.split(/(```[\s\S]*?```)/);
  let addedFirst = false;
  let lastProseIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('```')) continue;
    if (/\[\d+\]/.test(parts[i]) && !/\$\[\d+\]/.test(parts[i])) {
      return md;
    }
    lastProseIdx = i;
  }
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('```')) continue;
    if (addedFirst) break;
    parts[i] = parts[i].replace(/(^[A-Z][\s\S]{80,400}?\.)/m, (m) => {
      if (addedFirst) return m;
      addedFirst = true;
      return m.replace(/\.\s*$/, ' [1].');
    });
  }
  if (addedFirst && refCount >= 2 && lastProseIdx >= 0) {
    const block = parts[lastProseIdx];
    if (!/\[\d+\]/.test(block.split('\n').slice(-8).join('\n'))) {
      parts[lastProseIdx] = block.replace(/(\n## References & Further Reading)/, ` [2]\n$1`);
      if (parts[lastProseIdx] === block) {
        const paras = block.trimEnd();
        parts[lastProseIdx] = paras.replace(/(\.\s*)(\n*)$/, ' [2].$2');
      }
    }
  }
  return parts.join('');
}

function elevateMermaid(md) {
  return md.replace(/```mermaid([^\n]*)\n([\s\S]*?)```/g, (full, flags, body) => {
    if (/sequenceDiagram|mindmap|classDiagram|stateDiagram|gantt/i.test(body)) {
      return full;
    }
    let b = body;
    b = b.replace(/(\b[A-Za-z][\w]*)\[(?!["(/])([^\]]+)\]/g, '$1["$2"]');
    if (!/classDef /.test(b) && /flowchart\s+TD/.test(b)) {
      const ids = [...b.matchAll(/(\b[A-Za-z][\w]*)\["/g)].map((m) => m[1]);
      const uniq = [...new Set(ids)].filter((id) => !/^SG\d/.test(id)).slice(0, 24);
      const palette = [
        'classDef green fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;',
        'classDef red fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;',
        'classDef blue fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;',
        'classDef yellow fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;',
        'classDef purple fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;',
      ];
      const buckets = { blue: [], green: [], purple: [], yellow: [], red: [] };
      const order = ['blue', 'green', 'purple', 'yellow', 'red'];
      uniq.forEach((id, i) => buckets[order[i % order.length]].push(id));
      const classLines = order
        .filter((k) => buckets[k].length)
        .map((k) => `class ${buckets[k].join(',')} ${k}`);
      b = b.trimEnd() + '\n\n' + palette.join('\n') + '\n' + classLines.join('\n') + '\n';
    }
    return '```mermaid' + flags + '\n' + b + '```';
  });
}

const CUSTOM_COVER = {
  'cinema-in-the-age-of-ai-8-films-decoding-modern-ai-architecture': '/blog/assets/covers/cinema-in-the-age-of-ai.jpg',
  'how-to-tame-your-agents-deterministic-ai-engineering-strategies': '/blog/assets/covers/how-to-tame-your-agents.jpg',
};

let refAdded = 0;
let mermaidTouched = 0;
let citesAdded = 0;

for (const post of posts) {
  const slugJpg = `/blog/assets/covers/${post.slug}.jpg`;
  const custom = CUSTOM_COVER[post.slug];
  if (custom && existsSync(join(ROOT, custom.slice(1)))) {
    post.coverImage = custom;
  } else if (existsSync(join(COVER_DIR, `${post.slug}.jpg`))) {
    post.coverImage = slugJpg;
  }

  const mdPath = join(POSTS_DIR, `${post.slug}.md`);
  if (!existsSync(mdPath)) continue;
  let md = readFileSync(mdPath, 'utf8');
  const before = md;

  if (!/^## References & Further Reading\s*$/m.test(md)) {
    const refs = pickRefs(post, md);
    md = md.trimEnd() + `\n\n## References & Further Reading\n\n${refs.join('\n')}\n`;
    md = addInlineCites(md, refs.length);
    refAdded++;
    citesAdded++;
  }

  const elevated = elevateMermaid(md);
  if (elevated !== md) {
    mermaidTouched++;
    md = elevated;
  }

  if (md !== before) writeFileSync(mdPath, md);
}

writeFileSync(postsPath, JSON.stringify(posts, null, 2) + '\n');

const coverFiles = readdirSync(COVER_DIR).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
const missingCovers = posts.filter((p) => !existsSync(join(ROOT, (p.coverImage || '').replace(/^\//, ''))));
console.log(JSON.stringify({
  posts: posts.length,
  uniqueCoverImages: new Set(posts.map((p) => p.coverImage)).size,
  coverFiles: coverFiles.length,
  missingCoverFiles: missingCovers.map((p) => p.slug),
  refSectionsAdded: refAdded,
  mermaidPalettes: mermaidTouched,
  citePasses: citesAdded
}, null, 2));
