# Test Case: TC-AUTH-PWRESET-001

- **ID:** TC-AUTH-PWRESET-001
- **Title / Name:** Password reset request and confirmation
- **Related Requirement(s):** REQ-AUTH-PASSWORD-RESET
- **Type:** integration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify that a password reset flow issues a reset token and allows the user to set a new password via the confirmation endpoint.

## Preconditions
- An existing user with known email exists in DB (seeded or created in test).

## Test Data
- POST `/api/v1/auth/password-reset` with `{ "email": "existing@test.dev" }` and then use returned/reset token to confirm new password.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Reset request and confirm with token | Reset request returns acceptance; confirm endpoint accepts token and sets new password | `{ "email": "existing@test.dev" }`, token from email/log | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. POST `/api/v1/auth/password-reset` with user's email.
2. Assert `200 OK` (or `202 Accepted`) and that a reset token is generated (inspect test logs or DB entry since email not sent in tests).
3. POST `/api/v1/auth/password-reset/confirm` with `{ "token": "<token>", "password": "newpass123" }`.
4. Assert `200 OK` and then login with new password succeeds.

## Expected Result (full)
- Password reset request is acknowledged; confirmation endpoint accepts token and new password; subsequent login with new password returns `200 OK` and access token.

## Postconditions / Cleanup
- Restore original password or delete test account.

## Notes / References
- Test file: `backend/tests/test_password_reset.py`.
