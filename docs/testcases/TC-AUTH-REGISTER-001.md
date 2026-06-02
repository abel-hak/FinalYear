# Test Case: TC-AUTH-REGISTER-001

- **ID:** TC-AUTH-REGISTER-001
- **Title / Name:** User registration and immediate login
- **Related Requirement(s):** REQ-AUTH-REGISTER, REQ-AUTH-LOGIN
- **Type:** integration
- **Priority / Severity:** P0
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify a new learner can register via `POST /api/v1/auth/register` and then immediately log in using credentials.

## Preconditions
- No existing account with the chosen username/email.

## Test Data
- Payload: `{ "username": "testreg_{uuid}", "email": "testreg_{uuid}@test.dev", "password": "test123", "role": "learner" }`

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Register payload then login form data | `201 Created` for register; `200 OK` and access_token for login | JSON payload above | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. POST `/api/v1/auth/register` with JSON payload.
2. Assert status `201 Created` and response contains user id/username.
3. POST `/api/v1/auth/login` with form data username/password.
4. Assert `200 OK` and returned `access_token` is present.

## Expected Result (full)
- Registration returns `201` and user created. Login returns JWT bearer token; user can call authenticated endpoints (e.g., `GET /api/v1/progress`).

## Postconditions / Cleanup
- Delete created test user or rely on test DB reset.

## Notes / References
- Related tests: `backend/tests/test_auth_and_flows.py`.
