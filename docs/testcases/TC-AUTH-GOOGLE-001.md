# Test Case: TC-AUTH-GOOGLE-001

- **ID:** TC-AUTH-GOOGLE-001
- **Title / Name:** Google sign-in creates or links learner account
- **Related Requirement(s):** REQ-AUTH-GOOGLE
- **Type:** integration
- **Priority / Severity:** P0
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend team

## Purpose
Verify Google OAuth flow: exchanging Google credential returns app token, and the backend either links to an existing account or creates a new learner account.

## Preconditions
- Google credential verification is mocked in tests or a test Google client is available.

## Test Data
- POST `/api/v1/auth/google` with JSON `{ "credential": "google-token" }` (mocked verification returns sample email).

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Google credential JSON | `200 OK` and `access_token` in response; account created or linked | `{ "credential": "google-token" }` (mocked verifier returns email) | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Monkeypatch or mock `app.services.auth_service.verify_google_credential` to return a payload with `email` and `sub`.
2. POST `/api/v1/auth/google` with the credential JSON.
3. Assert `200 OK` and response includes `access_token` and `token_type: bearer`.
4. Use token to `GET /api/v1/auth/me` and assert user email matches expected.

## Expected Result (full)
- The backend returns an app JWT and creates/links a learner account for the given email; authenticated `me` endpoint returns correct user data.

## Postconditions / Cleanup
- Remove test account or rely on test DB reset; clear any monkeypatches.

## Notes / References
- Tests: `backend/tests/test_auth_and_flows.py::test_google_sign_in_links_existing_password_account` and `::test_google_sign_in_creates_learner_account`.
