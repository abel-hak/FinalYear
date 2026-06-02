# Test Case Specification Template

> Copy this template for each test case. Fill one file per test case or keep a table of cases in a single document.

- **ID:** TC-REQ-000
- **Title / Name:**
- **Related Requirement(s):** REQ-XXX
- **Type:** unit | integration | E2E | acceptance | regression
- **Priority / Severity:** P0 | P1 | P2
- **Author / Date / Status:**
- **Owner / Maintainer:**

## Purpose
Describe why this test exists and what it verifies.

## Preconditions
- Environment, accounts, DB state, config values, services running.

## Test Data
- List fixtures, seed scripts, or sample payloads used for this test.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| (short description of input) | (short description of expected outcome) | (reference to fixture or inline JSON) | (fill after run) | (Pass / Fail) |

Example:
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Empty `name` and other fields valid | Validation error: "Enter correctly formatted name" | `{ "name": "", "email": "a@b.com" }` | "Enter correctly formatted name" | Fail |

## Test Steps (detailed)
1. Step 1: Setup preconditions (seed DB, start services).
2. Step 2: Execute action (HTTP POST to `/api/...`).
3. Step 3: Observe result and capture actual output.
4. Step 4: Cleanup (rollback transaction, delete created data).

## Expected Result (full)
Describe the exact observable outcome including status codes, JSON schema, side-effects (DB rows, emails, metrics).

## Postconditions / Cleanup
- Describe how to restore environment to a clean state.

## Notes / References
- Link to scripts, logs, or related tests. Example: `backend/scripts/seed.py`, `docs/SRS-TESTS.md#traceability-matrix`.
