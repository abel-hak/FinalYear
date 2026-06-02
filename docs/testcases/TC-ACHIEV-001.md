# Test Case: TC-ACHIEV-001

- **ID:** TC-ACHIEV-001
- **Title / Name:** Achievement: First fix unlocks points
- **Related Requirement(s):** REQ-ACHIEVEMENTS-FIRST-FIX
- **Type:** integration
- **Priority / Severity:** P1
- **Author / Date / Status:** auto-generated, 2026-05-31, draft
- **Owner / Maintainer:** backend / gamification team

## Purpose
Verify that on a learner's first successful quest completion, the `first_fix` achievement awards the expected bonus points (e.g., 50 points).

## Preconditions
- Register a fresh learner account with zero prior completions.
- Create or identify a quest with a simple passing solution and set an XP reward (via admin API if needed).

## Test Data
- Submit payload: `{ "code": "print(5)" }` for a quest where expected output is `5`.

## Test Case Table
| Input | Expected result | Data (payload / fixtures) | Actual output | Pass / Fail |
|---|---|---:|---|---|
| Submit correct code as first successful completion | Submission `passed: true`; progress `total_points` includes quest XP + `first_fix` award (50) | `{ "code": "print(5)" }`, fresh learner account | (fill after run) | (Pass / Fail) |

## Test Steps (detailed)
1. Admin create quest with known solution and XP reward (e.g., 25 XP).
2. Register and login fresh learner.
3. Submit correct code to quest and assert `passed: true`.
4. GET `/api/v1/progress` and verify `total_points` includes quest XP plus 50 (first_fix) and any applicable achievement XP.

## Expected Result (full)
- Submission passes. The learner's points reflect quest XP + achievement awards. For example, `total_points == xp_reward + 50 + other_achievement_points` as defined.

## Postconditions / Cleanup
- Remove test quest and learner or rely on test DB reset.

## Notes / References
- Test: `backend/tests/test_quest_submit.py::test_custom_quest_xp_and_first_fix_achievement_are_added`.
