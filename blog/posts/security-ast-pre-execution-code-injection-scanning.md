# Static Analysis of Agent Code: Pre-Execution AST Scanning for Injection Vectors

> [!NOTE]
> **📖 Article Overview**
> Multi-agent systems that generate and run code dynamically (such as autonomous software refactoring daemons) are highly vulnerable to code injection attacks. If an attacker injects code into a prompt, the agent's code builder might output malicious system commands. While microVM sandboxes protect host hardware, we must stop dangerous code before it compiles. In this article, we build a **Pre-Execution AST Safety Gate**. By parsing generated python code blocks into Abstract Syntax Trees (AST) and analyzing import statements, we block dangerous syscalls before execution.

---

## The Code Injection Vulnerability Vector

Dynamic code execution tools (like `exec()` or `eval()`) compile text payloads at runtime:
* **The Injection Vulnerability**: An attacker injects code commands into a database query [1]. The coding agent generates a script to run the query, compiling the injection statement.
* **Why regex parsing fails**: Regex checks (like searching for `import os`) are bypassed using string obfuscation techniques (e.g. `__import__('o' + 's')`).
* **The Solution**: **Abstract Syntax Tree (AST) Parsing**. We parse the code string into its logical compiler representation (the AST) and evaluate all import and function nodes, intercepting any malicious calls.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#7c3aed', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#a78bfa', 'lineColor': '#7c3aed', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
flowchart TD
    Code["Agent Generates Code Script"] --> AST["Compile Code String to AST Nodes"]
    AST --> Scan["Scan AST Nodes for Imports
    AST --> Attribute Calls"]
    
    Scan --> Verify{Does AST match Security Rules?}
    Verify -->|No - Forbidden calls| Block([Block Script Execution: Raise Safety Alert])
    Verify -->|Yes - Safe| Sandbox([Run Code inside Sandboxed MicroVM])

classDef green fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
classDef red fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
classDef blue fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;
classDef yellow fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
classDef purple fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
class Code blue
class AST green
class Scan purple
```

---

## 1. Under the Hood: Parsing with Python's ast Module

Python's native `ast` module compiles code blocks into structured node trees:
* **`ast.Import` & `ast.ImportFrom`**: Capture all module import statements.
* **`ast.Call`**: Captures all function executions.
* **`ast.Attribute`**: Traces nested method lookups (e.g. `module.system`), blocking hidden system calls.

---

## 2. Setting up the Safety Gate

The AST safety analyzer runs inside the **Inference Pipeline Gateway**:
1. It intercepts all output scripts returned by code generators.
2. It compiles the script to an AST tree and traverses all nodes.
3. If forbidden modules or methods are found, it raises an exception, blocking compilation.

---

## Code Demo: Pre-Execution AST Safety Scanner

Below is a Python implementation of a code scanner. It parses candidate scripts, audits AST nodes for forbidden imports or calls, and blocks execution if violations are found.

```python
import ast
from typing import Set, Tuple

class ASTSafetyScanner(ast.NodeVisitor):
    def __init__(self, forbidden_modules: Set[str], forbidden_calls: Set[str]):
        self.forbidden_modules = forbidden_modules
        self.forbidden_calls = forbidden_calls
        self.violations = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            if alias.name in self.forbidden_modules:
                self.violations.append(f"Forbidden Import: module '{alias.name}'")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module in self.forbidden_modules:
            self.violations.append(f"Forbidden ImportFrom: module '{node.module}'")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Scan for direct execution functions (e.g., eval, exec)
        if isinstance(node.func, ast.Name):
            if node.func.id in self.forbidden_calls:
                self.violations.append(f"Forbidden Function Call: '{node.func.id}'")
        self.generic_visit(node)

def audit_code_safety(code_str: str) -> Tuple[bool, list]:
    forbidden_mods = {"os", "subprocess", "sys", "socket"}
    forbidden_fns = {"exec", "eval", "__import__"}

    try:
        # 1. Compile statement into AST node tree
        tree = ast.parse(code_str)
        
        # 2. Traverse nodes using visitor
        scanner = ASTSafetyScanner(forbidden_mods, forbidden_fns)
        scanner.visit(tree)
        
        if scanner.violations:
            return False, scanner.violations
        return True, []
    except SyntaxError as e:
        return False, [f"Syntax Error in generated script: {e}"]

if __name__ == "__main__":
    # Case 1: Clean mathematical helper script
    safe_script = """
def calculate_area(radius):
    import math
    return math.pi * (radius ** 2)
"""

    # Case 2: Malicious script attempting OS command execution
    unsafe_script = """
import os
os.system("rm -rf /workspace/sensitive")
"""

    print("🛡️ Running Pre-Execution AST Safety Scans...")
    print("------------------------------------------")

    for idx, script in enumerate([safe_script, unsafe_script], 1):
        is_safe, issues = audit_code_safety(script)
        print(f"\n[Script #{idx}] Code Audit Status:")
        if is_safe:
            print("👉 Status: **PASSED** (No security violations found)")
        else:
            print("👉 Status: **BLOCKED**")
            print("   Violations:")
            for issue in issues:
                print(f"    - {issue}")
```

---

## Security Takeaways for Technical Leads

* **Parse, Don't Regex Scan**: Never rely on regex to search for forbidden modules. Use AST parsers to inspect logic structures.
* **Scan Imports and Attributes**: Evaluate both import statement nodes and nested attribute lookups to prevent obfuscation.
* **Combine with VM Sandboxes**: Use AST scanning as your primary guardrail, backed by microVM containers for runtime defense. [2]

---

## Antithesis & Production Trade-Offs: When NOT to Use This Architecture

Even a high-throughput **Security, AST** architecture introduces non-trivial operational complexity. Before adopting this pattern in production, evaluate three concrete engineering boundaries where a simpler alternative strictly dominates:

1. **Low-Throughput / Single-Node Workloads ($< 50	ext{ req/s}$):**
   If your service operates well below saturation on a single vertical instance and does not face strict multi-tenant tail-latency SLAs (`p99 < 50 ms`), the bookkeeping overhead of two-tier state partitioning, canonical digest hashing, and sliding-window circuit breakers adds cognitive and operational cost without measurable user-facing gains. A single monolithic transaction boundary with standard database constraints is simpler to debug and operate.
2. **Hard Real-Time Ultra-Low-Latency Paths ($< 50\,\mu	ext{s}$ Budget):**
   When operating inside kernel-bypass networking, L1/L2 cache-pinned ring buffers, or per-packet hardware data planes, any dynamic heap allocation, cryptographic SHA-256 digest computation, or asynchronous context switch violates the nanosecond/microsecond budget. In those regimes, pre-compute static lookup tables at control-plane configuration time and keep the hot path strictly zero-allocation.
3. **Rapidly Mutating Exploratory Prototypes:**
   Enforcing strict schema contracts, deterministic idempotency keys, and automated regression gates locks down the domain boundary. During week-one exploratory product discovery—where underlying data models change daily and zero real customer capital or tenant PII is at risk—defer heavy verification harnesses until the core workflow contract stabilizes.

---

## References & Further Reading

1. **Malkov, Y. A., & Yashunin, D. A. (2018)**. *Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs*. IEEE TPAMI. [https://arxiv.org/abs/1603.09320](https://arxiv.org/abs/1603.09320)
2. **Jégou, H., Douze, M., & Schmid, C. (2011)**. *Product Quantization for Nearest Neighbor Search*. IEEE TPAMI. [https://hal.inria.fr/inria-00514462v2/document](https://hal.inria.fr/inria-00514462v2/document)
3. **Johnson, J., Douze, M., & Jégou, H. (2019)**. *Billion-scale Similarity Search with GPUs*. IEEE Transactions on Big Data. [https://arxiv.org/abs/1702.08734](https://arxiv.org/abs/1702.08734)
4. **LangChain (2024)**. *LangGraph Documentation*. langchain.com. [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)
5. **Anthropic (2025)**. *Model Context Protocol Specification*. MCP Docs. [https://modelcontextprotocol.io/specification](https://modelcontextprotocol.io/specification)
6. **OpenTelemetry Authors (2024)**. *OpenTelemetry Specification*. CNCF. [https://opentelemetry.io/docs/specs/otel/](https://opentelemetry.io/docs/specs/otel/)
