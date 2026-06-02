# Test Case: TC-SANDBOX-001

- **ID:** TC-SANDBOX-001
- **Title / Name:** Sandbox execution — timeout and error handling
- **Related Requirement(s):** REQ-SANDBOX-ISOLATION, REQ-SANDBOX-TIMEOUT
- **Type:** unit / integration
- **Priority / Severity:** P0
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Confirm the local Python execution sandbox enforces timeouts, returns timed_out indicator, and surfaces errors appropriately to the caller.

## Preconditions
- Sandbox runner available (local subprocess implementation used in tests).

## Test Data
- Code: `while True: pass` (infinite loop) — execute with `timeout_seconds=1` in `run_python`.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Execute infinite-loop code with 1s timeout | `SandboxResult.timed_out == True`, `exit_code == -1`, `stderr` indicates timeout | code string `while True: pass`, timeout_seconds=1 | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Call `run_python("while True: pass", timeout_seconds=1)`.
2. Assert the returned `SandboxResult` has `timed_out` set to true, `exit_code == -1` and stderr mentions timeout.

## Expected Result (full)
- The sandbox terminates the execution after the configured timeout.
- The result object indicates a timeout and non-zero/negative exit-code suitable for upper layers to return a 503 or timeout response.

## Postconditions / Cleanup
- No lingering processes; verify no child processes remain.

## Notes / References
- Test implementation: `backend/tests/test_sandbox.py::test_run_python_timeout` and `backend/tests/test_quest_submit.py::test_submit_system_busy_on_sandbox_error` (which patches `app.core.code_runner.run_python` to raise OSError).
