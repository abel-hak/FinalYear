# XP Handling Overview

This document summarizes how XP is stored, awarded, aggregated, and shown to learners across the backend and frontend.

## What counts as XP

The codebase has two XP sources:

- Quest XP: stored on each quest as `xp_reward`.
- Achievement XP: stored on each achievement definition as `xp`.

Learner-facing totals usually start from quest XP and then, in some places, add unlocked achievement XP on top.

## Backend: where XP is stored

### Quest XP lives on the quest model

The quest model has an `xp_reward` column with a default of 10. The Pydantic quest schemas also expose `xp_reward` to the learner-facing API and admin APIs.

Relevant files:

- [backend/app/models/quest.py](../backend/app/models/quest.py)
- [backend/app/schemas/quest.py](../backend/app/schemas/quest.py)
- [backend/app/schemas/admin.py](../backend/app/schemas/admin.py)

### Learner XP is persisted on the learner row

The learner model stores `total_points`, which is the persistent quest-point total for that learner. It starts at 0.

Relevant file:

- [backend/app/models/learner.py](../backend/app/models/learner.py)

## Backend: how XP is awarded

### Quest submission adds quest XP once, on the first passing completion

When a learner submits a solution and all tests pass, the submission service checks whether that learner has already passed the quest before. If not, it increments `learner.total_points` by the quest’s `xp_reward` and updates the learner’s level if the quest level is higher.

Important details:

- XP is only added on the first successful pass for a quest.
- Re-submitting a quest that was already completed does not add XP again.
- If a quest has no XP set, the backend falls back to 10.

Relevant file:

- [backend/app/services/quest_submission_service.py](../backend/app/services/quest_submission_service.py)

### The submission response does not include XP directly

The quest submission API returns pass/fail, test results, stdout/stderr, and actual output, but not a dedicated XP field. XP is reflected indirectly through updated progress totals after the submission succeeds.

Relevant files:

- [backend/app/api/quests.py](../backend/app/api/quests.py)
- [backend/app/schemas/execute.py](../backend/app/schemas/execute.py) if you want the submission payload shape

## Backend: how lifetime XP is computed

### Progress and some dashboards use lifetime XP, not just quest XP

`PointsService.get_lifetime_points_for_user()` returns the learner’s stored quest points plus the XP from all unlocked achievements. That means the lifetime total is quest XP + achievement XP.

Relevant file:

- [backend/app/services/points_service.py](../backend/app/services/points_service.py)

### Progress API uses lifetime points

The learner progress endpoint returns `total_points` from `PointsService`, so the progress dashboard total includes unlocked achievement XP in addition to quest XP.

Relevant files:

- [backend/app/services/learner_progress_service.py](../backend/app/services/learner_progress_service.py)
- [backend/app/api/progress.py](../backend/app/api/progress.py)
- [backend/app/schemas/progress.py](../backend/app/schemas/progress.py)

### Achievements themselves carry XP values

Each achievement definition includes an XP amount. Unlocking an achievement does not mutate `learner.total_points`; instead, the achievement XP is counted when `PointsService` calculates lifetime points.

Relevant files:

- [backend/app/services/achievement_service.py](../backend/app/services/achievement_service.py)
- [backend/app/schemas/achievement.py](../backend/app/schemas/achievement.py)
- [backend/app/api/achievements.py](../backend/app/api/achievements.py)

## Backend: leaderboard XP rules

### All-time leaderboard uses lifetime XP

For the all-time and lifetime views, the leaderboard service uses `PointsService`, so the ranking includes quest XP plus unlocked achievement XP.

### Weekly and monthly leaderboards use raw quest XP

For weekly and monthly periods, the repository sums `Quest.xp_reward` for first-pass submissions in the time window. Those views do not add achievement XP.

This means leaderboard XP depends on the selected period:

- `all` / `lifetime`: quest XP + unlocked achievement XP
- `weekly`: quest XP only, within the last 7 days
- `monthly`: quest XP only, within the last 30 days

Relevant files:

- [backend/app/services/leaderboard_service.py](../backend/app/services/leaderboard_service.py)
- [backend/app/repositories/leaderboard_repository.py](../backend/app/repositories/leaderboard_repository.py)
- [backend/app/api/leaderboard.py](../backend/app/api/leaderboard.py)

## Backend: seeded XP defaults

The curriculum seeding script assigns default XP rewards when a quest does not specify one:

- Level 1: 10 XP
- Level 2: 15 XP
- Level 3 and above: 20 XP

That default only applies during seed creation. Admin-created quests can explicitly set `xp_reward`.

Relevant file:

- [backend/scripts/seed_curriculum.py](../backend/scripts/seed_curriculum.py)

## Frontend: where XP is shown

### Home page progress snapshot

The home page shows:

- XP to next milestone
- Next milestone value
- Total XP earned
- Quest count and completion count

It also uses the progress API’s `total_points` for the main XP total.

A subtle issue here is that featured quest cards on the home page currently hardcode `xp: 50` instead of using the backend quest reward.

Relevant files:

- [frontend/src/pages/Index.tsx](../frontend/src/pages/Index.tsx)
- [frontend/src/components/QuestCard.tsx](../frontend/src/components/QuestCard.tsx)

### Quest map page

The quests page shows:

- Completed count
- Total XP for completed quests
- Overall completion percentage

It computes total XP by summing `xp_reward` from completed quests returned by the progress API.

Relevant file:

- [frontend/src/pages/Quests.tsx](../frontend/src/pages/Quests.tsx)

### Quest detail page

The quest detail page shows an XP badge near the title, but it does not use the API’s `xp_reward` directly. Instead, it hardcodes XP from the quest level:

- Level 1 -> 50 XP
- Level 2 -> 75 XP
- Level 3+ -> 100 XP

That means the displayed reward can disagree with the backend if an admin changes `xp_reward` to a custom value.

Relevant file:

- [frontend/src/pages/QuestPage.tsx](../frontend/src/pages/QuestPage.tsx)

### Achievements page

The achievements page shows:

- Unlocked count
- XP Earned total
- Per-achievement XP values
- Progress toward each achievement

It also fetches progress data and achievements data together.

Important bug: the page calculates total XP as progress `total_points` plus the XP of unlocked achievements. Because `progress.total_points` already includes unlocked achievement XP from the backend, the page double-counts achievement XP in the displayed total.

Relevant file:

- [frontend/src/pages/Achievements.tsx](../frontend/src/pages/Achievements.tsx)

### Leaderboard

The leaderboard page shows XP as the ranking metric and labels the period like this:

- all time: top learners by total XP
- weekly: most XP earned in the last 7 days
- monthly: most XP earned in the last 30 days

The entry card also maps total XP to a title tier such as Novice Debugger, Code Apprentice, Script Kiddie, Logic Ranger, Syntax Sorcerer, Bug Hunter, Code Ninja, and Master Architect.

Relevant files:

- [frontend/src/pages/Leaderboard.tsx](../frontend/src/pages/Leaderboard.tsx)
- [frontend/src/components/leaderboard/LeaderboardEntryCard.tsx](../frontend/src/components/leaderboard/LeaderboardEntryCard.tsx)
- [frontend/src/lib/utils.ts](../frontend/src/lib/utils.ts)

### Notifications and onboarding

XP is also mentioned in lightweight surfaces:

- The notification center includes a progress message with total XP.
- The onboarding tutorial explains that quests earn XP and that using fewer hints earns more XP.
- The FAQ has several XP explanations, including how XP is earned and how hints affect it.

Relevant files:

- [frontend/src/components/NotificationCenter.tsx](../frontend/src/components/NotificationCenter.tsx)
- [frontend/src/components/OnboardingTutorial.tsx](../frontend/src/components/OnboardingTutorial.tsx)
- [frontend/src/pages/FAQ.tsx](../frontend/src/pages/FAQ.tsx)

### Admin views

The admin user progress table shows each learner’s XP earned. The admin quest schemas and forms also expose `xp_reward`, so admins can set custom quest rewards.

Relevant files:

- [frontend/src/components/admin/UserProgressTable.tsx](../frontend/src/components/admin/UserProgressTable.tsx)
- [frontend/src/api/backend.ts](../frontend/src/api/backend.ts)

## API and DTO layer

The frontend API layer mirrors the backend shapes for:

- quest rewards (`xp_reward`)
- progress totals (`total_points`)
- leaderboard entries (`total_points`)
- achievement rewards (`xp`)
- admin user progress (`xp_earned`)

Relevant file:

- [frontend/src/api/backend.ts](../frontend/src/api/backend.ts)

## Notable mismatches

These are the main places where the displayed XP can diverge from the backend truth:

- Quest detail reward badge is derived from level, not the real `xp_reward`.
- Home page featured quest cards hardcode XP instead of reading quest rewards.
- Achievements page double-counts achievement XP in the total XP display.
- Weekly and monthly leaderboard XP do not include achievement XP, while all-time/lifetime does.

## Tests that lock the behavior

A few tests explicitly verify XP behavior:

- Quest submission adds custom quest XP and first-fix achievement XP to progress totals.
- Weekly/monthly leaderboard windows use raw quest XP.
- Lifetime leaderboard includes the extra achievement XP bonus.
- Achievement unlock tests confirm the first fix and hint achievements unlock correctly.

Relevant files:

- [backend/tests/test_quest_submit.py](../backend/tests/test_quest_submit.py)
- [backend/tests/test_leaderboard.py](../backend/tests/test_leaderboard.py)
- [backend/tests/test_achievements.py](../backend/tests/test_achievements.py)

## Bottom line

If you want the shortest accurate summary:

- Quest completions add `xp_reward` to `learner.total_points` once.
- Achievement XP is added later when lifetime totals are computed.
- The progress dashboard and all-time leaderboard use lifetime totals.
- Weekly/monthly leaderboard views use quest XP only.
- Several frontend screens show approximate or derived XP values, and one achievements total is currently double-counted.
