# Test Case: TC-PERF-SANDBOX-001

- **ID:** TC-PERF-SANDBOX-001
- **Title / Name:** Sandbox stress and concurrency behaviour (outline)
- **Related Requirement(s):** REQ-SANDBOX-SCALABILITY, REQ-SANDBOX-ISOLATION
- **Type:** performance / stress
- **Priority / Severity:** P2
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend / infra team

## Purpose
Outline a stress test to exercise many concurrent sandbox executions to observe resource usage, timeouts, and potential leaks.

## Preconditions
- A staging environment with resource limits representative of production; sandbox configured as in deployment (local subprocess or remote runner).

## Test Data
- A mix of short-running and CPU-bound code snippets; repeated submissions from simulated learners.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| 100 concurrent sandbox runs for 1 minute | No host OOM, average response latency < threshold, no persistent process leakage | code snippets payloads; orchestrated client load | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Deploy staging instance with monitoring (CPU, memory, process list).
2. Use load tool (Locust/k6) to spawn N concurrent sandbox requests producing mixed workloads (print statements, moderate loops, intentional timeouts).
3. Observe host metrics, sandbox process count, error rates, and response latency.
4. Continue for sustained window (e.g., 5–15 minutes) to detect leaks.

## Expected Result (full)
- System remains stable; sandbox enforcement terminates long-running tasks; CPU/memory usage remain within acceptable thresholds; no persistent zombie processes.

## Postconditions / Cleanup
- Collect logs and metrics; terminate load generators; revert staging changes.

## Notes / References
- This is an outline; implement as a scheduled performance job using `Locust` or `k6` with dashboards for metrics.
