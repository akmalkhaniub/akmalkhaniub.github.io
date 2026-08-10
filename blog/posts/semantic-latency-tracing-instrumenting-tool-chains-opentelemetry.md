# Semantic Latency Tracing: Instrumenting Tool Chains with OpenTelemetry

Debugging autonomous AI agents in production is notoriously difficult. Unlike standard microservices that execute short, linear requests, agents run long-lived, stateful loops that involve multiple sequential LLM calls, vector database retrievers, and recursive local tool executions.

If a customer request takes 12 seconds to complete, traditional Application Performance Monitoring (APM) tools cannot pinpoint whether the delay was caused by a slow database query, model generation timeouts, or recursive tool call loopbacks.

To solve this, we must implement **Semantic Latency Tracing** using **OpenTelemetry**.

By instrumenting our agent tool chains with OpenTelemetry span structures, we can capture model parameters, prompt context, and nested execution paths, creating visual trace trees of the agent's reasoning trajectory.

This article details how to instrument an agentic pipeline.

---

## 📖 OpenTelemetry Agent Trace Architecture

Semantic tracing wraps every model call and tool invocation inside nested tracer spans:

```mermaid
graph TD
  subgraph Trace ID: 77d43bf0-4278
    A[Root Span: /agent/execute_task] --> B[Sub-Span 1: model/generate_plan]
    A --> C[Sub-Span 2: tool/db_query]
    
    subgraph Nested Tool Execution Spans
      C --> D[Child Span: postgres/search_ledger]
    end
    
    A --> E[Sub-Span 3: model/synthesize_answer]
  end
```

### Trace Span Attributes for AI
To ensure interoperability with observability frontends (like Jaeger, Honeycomb, or Grafana Tempo), spans should record specific **Semantic Conventions**:
* `gen_ai.model`: The target model name (e.g. `gpt-4o`, `claude-3-5-sonnet`).
* `gen_ai.prompt_tokens` & `gen_ai.completion_tokens`: Used for real-time cost accounting.
* `tool.name` & `tool.input`: Captures parameters sent to external execution blocks.
* `tool.status`: Identifies failures in local integrations before they break the agent.

---

## 🛠️ Python Implementation: OpenTelemetry Agent Wrapper

Here is a production-grade Python implementation of an agent tracing wrapper using the official OpenTelemetry SDK. It tracks nested spans for LLM calls and tool executions, recording semantic metadata:

```python
import time
from typing import Dict, Any, Callable
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from pydantic import BaseModel

# 1. Initialize OpenTelemetry Tracer Provider (Usually exports to OTLP collector)
provider = TracerProvider()
processor = SimpleSpanProcessor(ConsoleSpanExporter())  # Exports logs to standard output
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("agentic-observability-tracer")

class LLMResponse(BaseModel):
    text: str
    prompt_tokens: int
    completion_tokens: int
    model_name: str

class TraceableAgent:
    """
    Executes tasks while creating nested spans for inner LLM calls and
    external tool execution pipelines.
    """
    def __init__(self, agent_name: str):
        self.agent_name = agent_name

    def execute_task(self, task_description: str) -> str:
        # Start Root Span representing the outer task execution
        with tracer.start_as_current_span("agent.execute_task") as root_span:
            root_span.set_attribute("agent.name", self.agent_name)
            root_span.set_attribute("agent.task", task_description)
            
            print(f"🏁 [Trace Start] Executing task: '{task_description}'")
            
            # Step 1: Model plans task
            plan = self._call_llm(
                prompt=f"Create a plan for: {task_description}",
                model="gpt-4o",
                span_name="model.plan_task"
            )
            
            # Step 2: Agent executes tool based on plan
            tool_output = self._run_tool(
                tool_name="ledger_db_lookup",
                tool_input={"user_id": "user-887"},
                tool_func=lambda: "Database Record: Active, Balance $1,250.00"
            )
            
            # Step 3: Model generates final response
            final_response = self._call_llm(
                prompt=f"Summarize output: {tool_output} for task: {plan.text}",
                model="gpt-4o",
                span_name="model.synthesize_final_answer"
            )
            
            root_span.set_attribute("agent.status", "completed")
            return final_response.text

    def _call_llm(self, prompt: str, model: str, span_name: str) -> LLMResponse:
        """Helper to invoke LLM inside a tracked model-specific span."""
        with tracer.start_as_current_span(span_name) as span:
            span.set_attribute("gen_ai.system", "openai")
            span.set_attribute("gen_ai.model", model)
            span.set_attribute("gen_ai.temperature", 0.0)
            
            print(f"  🤖 Running LLM ({model}) under span: '{span_name}'...")
            time.sleep(0.15)  # Simulate API network delay
            
            # Mock LLM API response metadata
            response = LLMResponse(
                text=f"Response generated for prompt: {prompt[:30]}...",
                prompt_tokens=45,
                completion_tokens=25,
                model_name=model
            )
            
            # Populate token usage details for metric aggregation
            span.set_attribute("gen_ai.usage.prompt_tokens", response.prompt_tokens)
            span.set_attribute("gen_ai.usage.completion_tokens", response.completion_tokens)
            
            return response

    def _run_tool(self, tool_name: str, tool_input: Dict[str, Any], tool_func: Callable[[], str]) -> str:
        """Helper to execute custom developer tools inside a tracked tool span."""
        with tracer.start_as_current_span("agent.run_tool") as span:
            span.set_attribute("tool.name", tool_name)
            span.set_attribute("tool.input", str(tool_input))
            
            print(f"  🛠️ Running Tool '{tool_name}'...")
            time.sleep(0.08)  # Simulate local execution latency
            
            try:
                result = tool_func()
                span.set_attribute("tool.status", "success")
                span.set_attribute("tool.output", result)
                return result
            except Exception as e:
                span.record_exception(e)
                span.set_status(trace.StatusCode.ERROR, str(e))
                raise e

# Demonstration Execution
if __name__ == "__main__":
    agent = TraceableAgent(agent_name="BillingAssistantSwarm")
    agent.execute_task("Check the account ledger balance for user-887")
```

---

## 🚨 Observability Gotchas & Guardrails

When tracing distributed agent swarms:

> [!IMPORTANT]
> **Enforce Strict Trace Context Propagation**: When an agent spawns parallel sub-worker threads, you must propagate the `ParentSpanContext` manually into the child threads. If context propagation is missed, the child threads will start isolated root spans, breaking the parent-child span tree relation in your dashboard.

> [!CAUTION]
> **Apply Prompt Sampling and Masking Rules**: Span attributes have size limitations and are exported to central observability dashboards. Never export raw prompt attributes containing plaintext passwords, credit card numbers, or API keys. Always run regex scrubbers on inputs before setting attributes.

---

## 📈 Real-World Enterprise Impact
Teams deploying semantic telemetry report:
* **Instant Outage Diagnostics**: Debugging times for stuck agents drop from hours to seconds by visualizing exactly which tool span hung.
* **Cost Allocation Auditing**: Dynamically calculating prompt token span attributes allows precise billing attribution per user tenant.
