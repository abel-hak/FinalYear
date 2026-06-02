# Test Case: TC-HINT-001

- **ID:** TC-HINT-001
- **Title / Name:** Hint system — per-quest hint limit enforced
- **Related Requirement(s):** REQ-HINT-LIMIT
- **Type:** integration
- **Priority / Severity:** P0
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Ensure a learner cannot request more than the allowed number of AI hints per quest (limit = 3).

## Preconditions
- Fresh learner account (no prior hints) created via register endpoint.
- Quest available (from seeded data) and accessible to the learner.

## Test Data
- Payload for hint request: `{ "quest_id": "{quest_id}", "code": "x = 5", "last_output": null }`

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| 4 sequential POSTs to `/api/v1/hints/ai` | First 3 requests => `200`; 4th => `403` with explanation about hint limit | JSON payload shown above, fresh learner token | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Register and login a fresh learner account.
2. Determine a quest id via `GET /api/v1/progress`.
3. For i in 1..3: POST `/api/v1/hints/ai` with hint payload — assert `200 OK` and response contains `hint` and updated `remaining`.
4. POST a 4th time — assert HTTP `403` and message indicates hint limit reached.

## Expected Result (full)
- First three requests succeed (`200 OK`), return `hint` content and `remaining` decrementing to 0.
- Fourth request returns `403 Forbidden` with a detail message about hint usage/limit.

## Postconditions / Cleanup
- No persistent side effects beyond used hint counters; reset or cleanup test DB as appropriate.

## Notes / References
- Test implementation: `backend/tests/test_hints.py::test_hint_limit_enforced_after_3_requests`.
