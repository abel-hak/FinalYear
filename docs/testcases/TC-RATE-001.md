# Test Case: TC-RATE-001

- **ID:** TC-RATE-001
- **Title / Name:** Submission rate limiting enforcement
- **Related Requirement(s):** REQ-SUBMISSION-RATE-LIMIT
- **Type:** integration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify that the submission endpoint enforces the configured per-minute rate limit and returns `429 Too Many Requests` when exceeded.

## Preconditions
- Environment variable or config for rate limit adjustable in test (e.g., `SUBMISSION_RATE_LIMIT_PER_MINUTE`).

## Test Data
- Series of POST `/api/v1/quests/{quest_id}/submit` calls; monkeypatch `SUBMISSION_RATE_LIMIT_PER_MINUTE` to a low value (2) for test speed.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Rapid submission calls exceeding limit | First N requests `200 OK`; next request `429` with rate-limit detail | `{ "code": "print(1)" }`, SUBMISSION_RATE_LIMIT_PER_MINUTE=2 | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Monkeypatch environment to set `SUBMISSION_RATE_LIMIT_PER_MINUTE=2` and clear settings cache.
2. Register fresh learner and get token; get quest id.
3. Submit twice (should succeed, 200).
4. Submit a 3rd time quickly — assert `429` and error message referencing rate limit.

## Expected Result (full)
- The third rapid submission returns `429 Too Many Requests` and the error body contains information about rate limit or retry timing.

## Postconditions / Cleanup
- Restore original environment values and clear cache.

## Notes / References
- Test implementation: `backend/tests/test_quest_submit.py::test_submit_rate_limit_5_per_minute` (monkeypatch variant).
