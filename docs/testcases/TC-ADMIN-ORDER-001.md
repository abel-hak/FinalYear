# Test Case: TC-ADMIN-ORDER-001

- **ID:** TC-ADMIN-ORDER-001
- **Title / Name:** Admin cannot create quest with duplicate `order_rank`
- **Related Requirement(s):** REQ-ADMIN-QUEST-VALIDATION
- **Type:** integration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend / admin APIs team

## Purpose
Ensure that the admin create-quest endpoint validates `order_rank` uniqueness and returns `400 Bad Request` when reused.

## Preconditions
- Admin account exists and can authenticate.
- At least one quest is present to reuse its `order_rank`.

## Test Data
- Payload attempting to create a quest using an existing `order_rank` value.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Create quest JSON with duplicate `order_rank` | `400 Bad Request` and detail referencing `order` or `order_rank` | JSON payload similar to tests with `order_rank` = used value | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Login as admin and fetch `/api/v1/admin/quests` to find an existing `order_rank`.
2. POST `/api/v1/admin/quests` with payload using the duplicated `order_rank`.
3. Assert `400 Bad Request` and response detail mentions `order` or duplicate rank.

## Expected Result (full)
- The API rejects creation with `400` and meaningful error message; no new quest is created.

## Postconditions / Cleanup
- None required; ensure no side-effects.

## Notes / References
- Test: `backend/tests/test_auth_and_flows.py::test_admin_cannot_reuse_order_rank`.
