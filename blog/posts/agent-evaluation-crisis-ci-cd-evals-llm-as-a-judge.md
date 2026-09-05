# The Agent Evaluation Crisis: How to Build Evals That Actually Catch Regressions in CI/CD

In modern continuous integration and delivery (CI/CD) pipelines, automated unit and integration tests are the ultimate safety net.

You write deterministic assertions (`assert response.status_code == 200`), run `pytest` or `jest`, and if all tests pass, the pull request merges safely to `main`.

When engineering autonomous AI agent systems (**Agent Fleet Orchestrator**, **SpecForge**, **LangGraph**, **Devin**), traditional testing fails completely:
* You update a system prompt to fix a subtle bug in Python refactoring → that change silently breaks the agent's ability to edit SQL schemas across **$30\%$ of unrelated workflows**.
* Traditional equality assertions (`assert output == expected_string`) trigger false alarms on every run because the LLM changes its phrasing and variable names stochastically.
* Teams either suffer from **$100\%$ flaky test suites** or stop running CI/CD evals altogether, shipping prompt changes blindly.

Solving the **Agent Evaluation Crisis** requires establishing a modern **Three-Tier Evaluation Pyramid**: combining **Deterministic Symbolic Assertions**, **Trajectory State Graphs**, and **Calibrated LLM-as-a-Judge Rubrics**.

```mermaid
graph TD
  subgraph The 3-Tier Agent Evaluation Pyramid
    Tier1["Tier 1: Deterministic Symbolic Invariants (AST Parsing, Type Checks, Linters, 10ms)"]
    Tier2["Tier 2: Trajectory Assertion Graphs (Tool Call Sequence DAG Validation, 50ms)"]
    Tier3["Tier 3: Calibrated LLM-as-a-Judge (Multi-Point Rubrics & Semantic Scoring, 1-2s)"]
  end
  
  PR[Pull Request: Prompt / Skill Change] --> BenchmarkDataset[Golden Benchmark Dataset (100 Cases)]
  BenchmarkDataset --> Tier1
  Tier1 -->|AST Passed| Tier2
  Tier2 -->|Trajectory Valid| Tier3
  Tier3 --> ScoreGate{Pass Rate >= 95%?}
  ScoreGate -->|Yes| Merge[✅ Merge to Main]
  ScoreGate -->|No| Block[❌ Block Build: Prompt Regression]
```

---

## 1. Why Traditional Unit Tests Fail on AI Agents

Traditional software testing relies on an invariant assumption: **deterministic inputs yield deterministic outputs ($f(x) = y$)**.

### The 3 Core Breakdown Modes of LLM Testing:
1. **The Semantic Paraphrasing Dilemma**: An agent tasked with writing a helper function might name it `calculate_tax` on Run 1 and `compute_tax_amount` on Run 2. Both are functionally correct, but an exact string match assertion fails.
2. **The "Silent Regression" Trap**: LLMs operate on a high-dimensional probability manifold. Improving performance on Task $A$ frequently degrades performance on Task $B$ (e.g. adding instructions to be "concise" causes the agent to stop generating unit tests).
3. **Flaky Test Fatigue**: When tests fail non-deterministically due to minor temperature variance, engineers learn to ignore CI/CD test failures, defeating the entire purpose of automated testing.

---

## 2. The 3-Tier Agent Evaluation Framework

```
> **THE 3-TIER EVALUATION PYRAMID**
| Tier 1: Deterministic Symbolic Invariants : AST parse validity, 0 linter errors, exit code 0      |
| Tier 2: Trajectory Graph Assertions       : Did the agent call tools in the correct logical DAG?  |
| Tier 3: Calibrated LLM-as-a-Judge Rubrics : Semantic goal completion, code readability, safety   |

```

---

### Tier 1: Deterministic Symbolic Invariants (Fast & Objective)
Before evaluating natural language quality, verify hard mathematical invariants in compiled code:
* **AST Parse Success**: Does the generated code parse into a valid Abstract Syntax Tree (`ast.parse()` / `tsc --noEmit`)?
* **Zero Security Violations**: Does static analysis confirm zero banned system calls (`eval`, `rm -rf`, `os.system`)?
* **Deterministic Test Execution**: Do the containerized unit tests pass with exit code `0`?

---

### Tier 2: Trajectory Assertion Graphs (Evaluating the Path Taken)
In autonomous agent swarms, **how the agent solved the problem** is just as important as the final answer.

A **Trajectory Assertion Graph** validates that the agent invoked tools in a logical, secure sequence:

```mermaid
graph LR
  subgraph Valid Trajectory DAG
    T1[1. view_file: Inspect Codebase] --> T2[2. replace_file_content: Apply Patch]
    T2 --> T3[3. run_test: Verify Execution]
  end
  
  subgraph Invalid Anti-Pattern (Flagged by Eval)
    A1[1. replace_file_content: Blindly Guess] --> A2[2. git_commit: Commit without Testing!]
  end
```

### Trajectory Assertion Examples:
* `assert "view_file" in trajectory.tool_names` (Agent inspected context before acting).
* `assert trajectory.index_of("replace_file_content") < trajectory.index_of("run_test")` (Agent tested after editing).
* `assert trajectory.tool_count <= 6` (Agent did not enter an infinite exploratory loop).

---

### Tier 3: Calibrated LLM-as-a-Judge with Multi-Point Rubrics
For subjective criteria (code readability, adherence to design patterns, explanation clarity), modern CI/CD pipelines use an independent **Judge Model (e.g. Claude 3.5 Sonnet / GPT-4o)** with a **Calibrated G-Eval Rubric**:

```yaml
Evaluation Rubric: Code Refactoring Quality
Score 5: Flawless refactor, exact type annotations, zero redundant code, preserves existing API.
Score 4: Working refactor with minor stylistic inconsistencies, preserves existing API.
Score 3: Working refactor but introduces breaking changes to existing method signatures.
Score 2: Non-compiling code or missing imports.
Score 1: Hallucinated dependencies or completely unrelated modifications.
```

---

## Python Implementation: Complete CI/CD Agent Evaluation Harness

Here is a Python implementation of an automated Agent Evaluation Harness combining AST symbolic checks, trajectory DAG assertions, and calibrated LLM Judge scoring:

```python
import ast
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

@dataclass
class AgentRunArtifact:
    task_id: str
    generated_code: str
    tool_trajectory: List[str]
    total_tokens: int

class AgentEvaluationHarness:
    """
    3-Tier Automated Evaluation Harness for Agent CI/CD Pipelines.
    """
    # --- TIER 1: DETERMINISTIC AST INVARIANT CHECK ---
    @classmethod
    def evaluate_tier1_ast_invariants(cls, code: str) -> Tuple[bool, str]:
        try:
            ast.parse(code)
            # Security assertion
            if "os.system" in code or "eval(" in code:
                return False, "Security invariant violated: Banned instruction detected."
            return True, "AST parsed cleanly with zero syntax errors."
        except SyntaxError as e:
            return False, f"AST Syntax Error at line {e.lineno}: {e.msg}"

    # --- TIER 2: TRAJECTORY GRAPH ASSERTIONS ---
    @classmethod
    def evaluate_tier2_trajectory_dag(cls, trajectory: List[str]) -> Tuple[bool, str]:
        if not trajectory:
            return False, "Trajectory is empty."

        # Rule 1: Must inspect file before editing
        if "replace_file_content" in trajectory:
            edit_idx = trajectory.index("replace_file_content")
            if "view_file" not in trajectory or trajectory.index("view_file") > edit_idx:
                return False, "Trajectory Violation: Attempted code edit before viewing file."

        # Rule 2: Must run tests after editing
        if "replace_file_content" in trajectory:
            edit_idx = trajectory.index("replace_file_content")
            if "run_test" not in trajectory or trajectory.index("run_test") < edit_idx:
                return False, "Trajectory Violation: Edited file without running verification tests."

        # Rule 3: Bounded execution ceiling
        if len(trajectory) > 8:
            return False, f"Trajectory Violation: Execution loop exceeded ({len(trajectory)} > 8 steps)."

        return True, "Trajectory DAG matches valid execution pattern."

    # --- TIER 3: CALIBRATED LLM-AS-A-JUDGE SCORING ---
    @classmethod
    def evaluate_tier3_judge_rubric(cls, task_goal: str, code: str) -> Tuple[int, str]:
        # Simulated LLM Judge evaluating G-Eval rubric
        if "def add_user" in code and "email: str" in code:
            return 5, "Flawless implementation adhering to typed specification."
        elif "def add_user" in code:
            return 4, "Functional implementation but missing strict type annotations."
        else:
            return 2, "Failed to implement required target function."

    # --- FULL CI/CD SUITE RUNNER ---
    def run_eval_suite(self, task_goal: str, run_artifact: AgentRunArtifact) -> Dict:
        print(f"\n🧪 [Eval Suite] Evaluating Task '{run_artifact.task_id}'...")

        # Run Tier 1
        t1_pass, t1_msg = self.evaluate_tier1_ast_invariants(run_artifact.generated_code)
        print(f" • Tier 1 (AST Invariants) : {'✅ PASSED' if t1_pass else '❌ FAILED'} - {t1_msg}")

        # Run Tier 2
        t2_pass, t2_msg = self.evaluate_tier2_trajectory_dag(run_artifact.tool_trajectory)
        print(f" • Tier 2 (Trajectory DAG) : {'✅ PASSED' if t2_pass else '❌ FAILED'} - {t2_msg}")

        # Run Tier 3
        score, rubric_feedback = self.evaluate_tier3_judge_rubric(task_goal, run_artifact.generated_code)
        print(f" • Tier 3 (Judge Rubric)   : ⭐ Score {score}/5 - {rubric_feedback}")

        overall_passed = t1_pass and t2_pass and (score >= 4)
        print(f" 🏁 [Overall CI/CD Result] : {'✅ MERGE PERMITTED' if overall_passed else '❌ BUILD BLOCKED'}")

        return {
            "task_id": run_artifact.task_id,
            "tier1_passed": t1_pass,
            "tier2_passed": t2_pass,
            "judge_score": score,
            "overall_passed": overall_passed
        }

# Demonstration Execution
if __name__ == "__main__":
    eval_runner = AgentEvaluationHarness()

    # Successful Run Sample
    valid_run = AgentRunArtifact(
        task_id="feat-auth-user",
        generated_code="def add_user(username: str, email: str) -> dict:\n    return {'user': username, 'email': email}\n",
        tool_trajectory=["view_file", "replace_file_content", "run_test"],
        total_tokens=2400
    )
    eval_runner.run_eval_suite("Create typed add_user endpoint", valid_run)

    # Flawed Run Sample (Blind edit without testing)
    flawed_run = AgentRunArtifact(
        task_id="feat-bad-patch",
        generated_code="def add_user(u, e):\n    os.system('rm -rf /tmp')\n    return {}\n",
        tool_trajectory=["replace_file_content"],
        total_tokens=1800
    )
    eval_runner.run_eval_suite("Create typed add_user endpoint", flawed_run)
```

---

## Summary: Traditional CI/CD vs Agent CI/CD Evals

| Dimension | Traditional Software CI/CD | Modern Agent CI/CD Evals |
|---|---|---|
| **Primary Assertion** | Exact string / boolean match | 3-Tier Pyramid (AST + Trajectory + Judge Rubric) |
| **Flakiness Mitigation** | Deterministic mock servers | Calibrated rubrics + Pass@K statistical sampling |
| **Path Verification** | Ignored (Only checks final output) | Trajectory Assertion Graphs validate tool order |
| **Security Gate** | Dependency scanners (Snyk) | AST verification of generated code before execution |
| **Merge Threshold** | $100\%$ green tests | $\ge 95\%$ Benchmark Pass Rate across 100 golden tasks |

---

## Architectural Takeaway
You cannot build reliable autonomous agent systems without **rigorous, multi-tier evaluation infrastructure**.

By anchoring agent evaluation to **deterministic AST invariants**, **trajectory state graphs**, and **calibrated LLM rubrics**, engineering organizations create robust CI/CD safety nets that catch prompt regressions before they ever reach production.
