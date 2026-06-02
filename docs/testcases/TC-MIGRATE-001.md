# Test Case: TC-MIGRATE-001

- **ID:** TC-MIGRATE-001
- **Title / Name:** Alembic migration apply and rollback integrity
- **Related Requirement(s):** REQ-DB-MIGRATIONS
- **Type:** integration / migration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend / DBA

## Purpose
Verify that applying migrations (`alembic upgrade head`) and rolling back to a previous revision preserves data integrity, and that migrations are idempotent where expected.

## Preconditions
- A snapshot of a representative test dataset in pre-migration schema or ability to seed the DB.

## Test Data
- Use migration scripts in `backend/alembic/versions/` and seed data from `backend/scripts/seed.py`.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Run `alembic upgrade head` then `alembic downgrade -1` | Upgrade succeeds, schema changes applied; downgrade restores previous schema and data invariant | migration files and seed data | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Start with a clean test DB and apply base migrations up to a known revision.
2. Seed test data relevant to key invariants (learners, quests, progress).
3. Run `alembic upgrade head` and assert exit status 0 and expected new tables/columns exist.
4. Run application-level checks to ensure data present and valid.
5. Run `alembic downgrade -1` (or to previous revision) and assert schema reverted and data invariant remains or is handled per migration design (document expected behavior).

## Expected Result (full)
- Migrations apply without error; downgrades restore schema consistently or fail gracefully if non-reversible migration; data integrity checks pass or documented exceptions are handled.

## Postconditions / Cleanup
- Destroy test DB snapshot and restore to baseline.

## Notes / References
- Alembic config: `backend/alembic.ini`; migrations in `backend/alembic/versions/`.
