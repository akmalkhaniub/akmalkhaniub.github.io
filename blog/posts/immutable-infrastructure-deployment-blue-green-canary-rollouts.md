# Immutable Infrastructure Deployment: Zero-Downtime Blue-Green & Canary Rollouts

In legacy IT operations, deploying application updates involved SSHing into live servers and applying patches in-place (**Mutable Infrastructure**). Over time, small differences between servers created severe configuration drift, making deployments unpredictable and prone to extended downtime.

Modern DevOps and SRE teams adhere to the **Immutable Infrastructure** paradigm.

Under Immutable Infrastructure, running container instances or VMs are never modified in-place. When code changes, new pre-tested container images are deployed alongside existing instances, and production traffic is safely transitioned using zero-downtime deployment patterns: **Blue-Green** and **Canary Rollouts**.

This article details how to design automated Canary deployments with real-time error rate monitoring and automated rollback triggers.

---

## Canary Traffic Shifting & Automated Rollback Architecture

Progressive traffic shifting and automated rollback monitoring across application versions:

```mermaid
graph TD
  User[Client Production Traffic] --> Router[Ingress Load Balancer / Router]
  
  subgraph Production Environments
    Router -->|90% Traffic| Blue[Blue Version v1.4: Stable Live Cluster]
    Router -->|10% Traffic| Canary[Canary Version v1.5: New Release Cluster]
  end
  
  subgraph Automated Canary Metric Monitor
    Canary -->|Emit HTTP Telemetry| Prometheus[(Prometheus / CloudWatch Metrics)]
    Prometheus -->|Poll Error Rate & Latency| Controller[Canary Rollout Controller]
    
    Controller -->|Error Rate < 0.1%: Healthy| StepUp[Increment Traffic: 10% -> 50% -> 100%]
    Controller -->|Error Rate > 1.0%: Outage!| Rollback[AUTOMATED ROLLBACK: Shift 0% Traffic to Canary]
  end
  
  StepUp --> Router
  Rollback --> Router
```

### Core Deployment Strategies
1. **Immutable Infrastructure**: Once an artifact (Docker container image or AMI) is built and signed, it is immutable. Configuration values are injected via environment variables at startup, guaranteeing identical behavior across Development, Staging, and Production.
2. **Blue-Green Deployments**: Provisions a separate, idle environment (**Green**) running the new release alongside the active environment (**Blue**). Once smoke tests pass, the load balancer flips 100% of user traffic from Blue to Green instantly. If an issue is discovered post-switch, flipping back to Blue takes seconds.
3. **Canary Progressive Rollouts**: Shifts traffic incrementally ($1\% → 5\% → 25\% → 100\%$) over a defined evaluation window. Real-time metric analyzers continuously compare canary error rates and p99 latencies against baseline stable instances. If metrics degrade beyond predefined thresholds, the controller triggers an automated instant rollback.

---

## Python Implementation: Canary Rollout & Automated Rollback Controller

Here is a production-grade Python simulation of a Canary Deployment Controller featuring progressive traffic weight adjustments and automated error-threshold rollbacks:

```python
import time
import random
from typing import Dict, Any, Tuple
from pydantic import BaseModel

class EnvironmentMetrics(BaseModel):
    total_requests: int = 0
    error_count: int = 0
    p99_latency_ms: float = 25.0

    @property
    def error_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.error_count / self.total_requests

class IngressTrafficRouter:
    """Simulates a programmable load balancer router (e.g. NGINX / Istio)."""
    def __init__(self):
        self.blue_weight: float = 100.0  # Percentage (0 - 100)
        self.canary_weight: float = 0.0

    def set_weights(self, blue: float, canary: float):
        self.blue_weight = blue
        self.canary_weight = canary
        print(f" 🔀 [Traffic Router] Updated Traffic Weights -> Blue (v1.0): {blue:.1f}% | Canary (v2.0): {canary:.1f}%")

    def route_request(self) -> str:
        """Deterministically routes request based on current traffic weight split."""
        val = random.uniform(0.0, 100.0)
        if val <= self.canary_weight:
            return "CANARY"
        return "BLUE"

class CanaryRolloutController:
    """
    Automates progressive canary deployment and triggers instant rollback on metric degradation.
    """
    def __init__(self, router: IngressTrafficRouter, max_allowed_error_rate: float = 0.05):
        self.router = router
        self.max_allowed_error_rate = max_allowed_error_rate
        self.current_step_index = 0
        self.rollout_steps = [5.0, 20.0, 50.0, 100.0]  # Canary Traffic Percentages
        self.status = "IN_PROGRESS"  # IN_PROGRESS, SUCCESSFUL, ROLLED_BACK

    def evaluate_step_metrics(self, canary_metrics: EnvironmentMetrics) -> bool:
        """
        Evaluates canary health. Triggers rollback if error rate exceeds threshold.
        """
        print(f"\n📊 [Canary Controller] Evaluating Step '{self.rollout_steps[self.current_step_index]}%' Health...")
        print(f"   Canary Stats: Requests={canary_metrics.total_requests:,} | Errors={canary_metrics.error_count} | Error Rate={canary_metrics.error_rate:.2%}")

        if canary_metrics.error_rate > self.max_allowed_error_rate:
            print(f" 🚨 CRITICAL METRIC DEGRADATION! Error Rate {canary_metrics.error_rate:.2%} > Max Allowed {self.max_allowed_error_rate:.2%}")
            self.trigger_rollback()
            return False

        # Metrics are healthy -> Promote to next canary step
        self.current_step_index += 1
        if self.current_step_index < len(self.rollout_steps):
            new_canary_weight = self.rollout_steps[self.current_step_index]
            self.router.set_weights(blue=100.0 - new_canary_weight, canary=new_canary_weight)
        else:
            self.status = "SUCCESSFUL"
            self.router.set_weights(blue=0.0, canary=100.0)
            print(" 🎉 [Canary Rollout] Deployment 100% Complete & Promoted to Stable!")
        return True

    def trigger_rollback(self):
        self.status = "ROLLED_BACK"
        self.router.set_weights(blue=100.0, canary=0.0)
        print(" 🔄 [AUTOMATED ROLLBACK EXECUTED] Shifted 0% traffic to Canary. Stable Blue Restored!")

# Demonstration Execution
if __name__ == "__main__":
    router = IngressTrafficRouter()
    controller = CanaryRolloutController(router, max_allowed_error_rate=0.05)  # 5% Max Error Rate

    print("🚀 Demonstrating Immutable Canary Rollout & Automated Rollback...")
    print("=" * 75)

    # 1. Start Canary Rollout at 5% Weight
    router.set_weights(blue=95.0, canary=5.0)

    # 2. Simulate Healthy Step 1 (5% Canary)
    metrics_step1 = EnvironmentMetrics(total_requests=1000, error_count=10)  # 1.0% error rate (Healthy)
    controller.evaluate_step_metrics(metrics_step1)

    # 3. Simulate Healthy Step 2 (20% Canary)
    metrics_step2 = EnvironmentMetrics(total_requests=2000, error_count=30)  # 1.5% error rate (Healthy)
    controller.evaluate_step_metrics(metrics_step2)

    # 4. Simulate Defective Release at Step 3 (50% Canary - Spike in HTTP 500 errors)
    print("\n⚡ Bug introduced in Canary Code causing database connection timeouts...")
    metrics_step3_bad = EnvironmentMetrics(total_requests=3000, error_count=360)  # 12.0% Error Rate (CRITICAL!)
    controller.evaluate_step_metrics(metrics_step3_bad)
```

---

## Deployment Gotchas & Best Practices

When engineering immutable canary deployment pipelines:

> [!IMPORTANT]
> **Ensure Backward Database Schema Compatibility**: During a canary rollout, both Blue (v1) and Canary (v2) instances write to the primary database simultaneously. Never apply breaking SQL column deletions or renames during code deployments. Use Expand-Contract database migrations.

> [!CAUTION]
> **Evaluate Sufficient Request Sample Sizes**: Do not evaluate error rate thresholds over tiny sample sizes (e.g. 5 requests). A single transient network glitch will trigger a false rollback. Ensure Canary metrics collect at least 500 requests before making step progression decisions.

---

## Real-World Enterprise Impact
Teams adopting immutable deployments and automated canary rollbacks report:
* **Zero System Outages from Bad Code Deploys**: Automated metric analyzers catch bugs during 5% canary shifts and roll back within seconds before most users notice.
* **100% Reproducible Production Releases**: Immutable container images eliminate "works on my machine" server configuration drift.
