# Test Case: TC-REQ-QUEST-001

- **ID:** TC-REQ-QUEST-001
- **Title / Name:** Quest submission — passing solution updates progress
- **Related Requirement(s):** REQ-QUEST-SUBMIT
- **Type:** integration
- **Priority / Severity:** P0
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify that submitting a correct solution returns passed=true, updates quest completion status, and awards XP/achievements as expected.

## Preconditions
- Backend test DB seeded (see `backend/scripts/seed.py`) with `learner1` and at least one quest that expects output `10`.
- API server running in test mode (local test client used in tests).

## Test Data
- Payload: `{ "code": "x = 7\nprint(x + 3)" }`

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Submit correct code for quest 1 | Response `passed: true`, `tests_passed == tests_total`, progress shows quest completed | `{ "code": "x = 7\nprint(x + 3)" }`, seeded learner1, seeded quest | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Login as `learner1` via `POST /api/v1/auth/login` (form data username/password).
2. GET `/api/v1/progress` to locate the current quest id.
3. POST `/api/v1/quests/{quest_id}/submit` with JSON payload containing the correct code.
4. Assert response status is `200` and JSON contains `passed: true` and `tests_total >= 1`.
5. GET `/api/v1/progress` and assert at least one quest has `status: "completed"`.
6. Cleanup: none (test DB ephemeral or transactional rollback in test harness).

## Expected Result (full)
- HTTP `200 OK`.
- JSON includes `passed: true`, `tests_passed == tests_total`, `tests_total >= 1`.
- Progress API reflects the quest as completed and total points updated accordingly.

## Postconditions / Cleanup
- Test harness should rollback or reset DB state; if running manually, remove created progress/submission records.

## Notes / References
- Test implementation: `backend/tests/test_quest_submit.py::test_submit_passing_code_returns_success`.
- Seed script: `backend/scripts/seed.py`.
