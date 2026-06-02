# Test Case: TC-REQ-QUEST-002

- **ID:** TC-REQ-QUEST-002
- **Title / Name:** Quest submission — failing solution returns tests info
- **Related Requirement(s):** REQ-QUEST-SUBMIT
- **Type:** integration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify that submitting an incorrect solution returns `passed: false` and includes test counts and failure details.

## Preconditions
- Backend test DB seeded with `learner1` and at least one quest with defined testcases.

## Test Data
- Payload: `{ "code": "x = 5\nprint(x + 3)" }` (intentionally incorrect for quest expecting 10)

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Submit incorrect code for quest 1 | Response `passed: false`, JSON contains `tests_passed` and `tests_total` | `{ "code": "x = 5\nprint(x + 3)" }` | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Login as `learner1`.
2. GET `/api/v1/progress` to get quest id.
3. POST `/api/v1/quests/{quest_id}/submit` with incorrect code.
4. Assert response `200` and body contains `passed: false` and `tests_passed`/`tests_total` keys.

## Expected Result (full)
- HTTP `200 OK`.
- JSON indicates failure: `passed: false` and includes test counts and failure reason(s) where applicable.

## Postconditions / Cleanup
- Test harness rollback or manual cleanup if necessary.

## Notes / References
- Test implementation: `backend/tests/test_quest_submit.py::test_submit_failing_code_returns_error`.
