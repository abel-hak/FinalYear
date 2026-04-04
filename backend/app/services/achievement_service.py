"""Achievements orchestration service."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.achievement_repository import AchievementRepository
from app.schemas.achievement import AchievementOut, AchievementProgress


@dataclass(frozen=True)
class _AchSpec:
    id: str
    title: str
    description: str
    icon_key: str
    xp: int
    rarity: str


ACHIEVEMENTS: list[_AchSpec] = [
    _AchSpec("first_fix", "First Fix", "Complete your first quest", "bug", 50, "common"),
    _AchSpec("quest_5", "Getting Started", "Complete 5 quests", "target", 150, "rare"),
    _AchSpec("quest_10", "Bug Hunter", "Complete 10 quests", "trophy", 250, "epic"),
    _AchSpec("quest_25", "Debugger", "Complete 25 quests", "star", 400, "legendary"),
    _AchSpec("quest_all", "Path Complete", "Complete all available quests", "code", 500, "legendary"),
    _AchSpec("level_2", "Level Up", "Reach Level 2", "zap", 150, "rare"),
    _AchSpec("level_3", "Advanced Learner", "Reach Level 3", "sparkles", 250, "epic"),
    _AchSpec("streak_3", "On a Roll", "Maintain a 3-day streak", "flame", 100, "rare"),
    _AchSpec("streak_7", "Consistent", "Maintain a 7-day streak", "flame", 250, "epic"),
    _AchSpec("streak_14", "Unstoppable", "Maintain a 14-day streak", "flame", 500, "legendary"),
    _AchSpec("ai_hint_first", "Ask for Help", "Use your first AI hint", "sparkles", 50, "common"),
    _AchSpec("no_ai_hints_1", "No-Hint Hero", "Complete 1 quest without AI hints", "shield", 150, "rare"),
    _AchSpec("no_ai_hints_5", "Pure Skill", "Complete 5 quests without AI hints", "shield", 350, "epic"),
    _AchSpec("first_try_5", "First-Try Finisher", "Pass 5 quests on your first submission", "check", 300, "epic"),
    _AchSpec("path_level_1", "Basics Path Complete", "Complete the Level 1 learning path", "book", 200, "rare"),
    _AchSpec("path_level_2", "Intermediate Path Complete", "Complete the Level 2 learning path", "book", 350, "epic"),
    _AchSpec("path_level_3", "Advanced Path Complete", "Complete the Level 3 learning path", "book", 500, "legendary"),
]


class AchievementService:
    """Computes learner achievements using repository aggregates."""

    def __init__(self, db: AsyncSession) -> None:
        self.repo = AchievementRepository(db)

    @staticmethod
    def _progress(current: int, max_v: int) -> AchievementProgress:
        return AchievementProgress(current=int(current), max=int(max_v or 1))

    async def list_achievements_for_user(self, user_id) -> list[AchievementOut]:
        learner = await self.repo.get_active_learner_by_user_id(user_id)

        quests = await self.repo.list_active_quests_ordered()
        total_quests = len(quests)

        subs = await self.repo.list_submissions_for_learner(learner.id)
        completed_ids: set = {s.quest_id for s in subs if s.passed}
        completed_count = len(completed_ids)

        first_try_pass_count = 0
        seen_first: set = set()
        for s in subs:
            if s.quest_id in seen_first:
                continue
            seen_first.add(s.quest_id)
            if s.passed:
                first_try_pass_count += 1

        hinted_quest_ids = await self.repo.list_hinted_quest_ids_for_learner(learner.id)
        ai_hint_count = len(hinted_quest_ids) if hinted_quest_ids else 0
        completed_no_ai_hint_count = len([qid for qid in completed_ids if qid not in hinted_quest_ids])

        paths = await self.repo.list_learning_paths_with_quests()
        path_progress_by_level: dict[int, tuple[int, int]] = {}
        for p in paths:
            quest_ids = [pq.quest_id for pq in (p.path_quests or [])]
            if not quest_ids:
                continue
            done = sum(1 for qid in quest_ids if qid in completed_ids)
            path_progress_by_level[p.level] = (done, len(quest_ids))

        out: list[AchievementOut] = []
        for spec in ACHIEVEMENTS:
            if spec.id == "first_fix":
                unlocked = completed_count >= 1
                prog = self._progress(min(completed_count, 1), 1)
            elif spec.id == "quest_5":
                unlocked = completed_count >= 5
                prog = self._progress(min(completed_count, 5), 5)
            elif spec.id == "quest_10":
                unlocked = completed_count >= 10
                prog = self._progress(min(completed_count, 10), 10)
            elif spec.id == "quest_25":
                unlocked = completed_count >= 25
                prog = self._progress(min(completed_count, 25), 25)
            elif spec.id == "quest_all":
                unlocked = total_quests > 0 and completed_count >= total_quests
                prog = self._progress(completed_count, total_quests)
            elif spec.id == "level_2":
                unlocked = int(learner.current_level) >= 2
                prog = self._progress(min(int(learner.current_level), 2), 2)
            elif spec.id == "level_3":
                unlocked = int(learner.current_level) >= 3
                prog = self._progress(min(int(learner.current_level), 3), 3)
            elif spec.id == "streak_3":
                unlocked = (learner.streak_days or 0) >= 3
                prog = self._progress(min(int(learner.streak_days or 0), 3), 3)
            elif spec.id == "streak_7":
                unlocked = (learner.streak_days or 0) >= 7
                prog = self._progress(min(int(learner.streak_days or 0), 7), 7)
            elif spec.id == "streak_14":
                unlocked = (learner.streak_days or 0) >= 14
                prog = self._progress(min(int(learner.streak_days or 0), 14), 14)
            elif spec.id == "ai_hint_first":
                unlocked = ai_hint_count >= 1
                prog = self._progress(min(ai_hint_count, 1), 1)
            elif spec.id == "no_ai_hints_1":
                unlocked = completed_no_ai_hint_count >= 1
                prog = self._progress(min(completed_no_ai_hint_count, 1), 1)
            elif spec.id == "no_ai_hints_5":
                unlocked = completed_no_ai_hint_count >= 5
                prog = self._progress(min(completed_no_ai_hint_count, 5), 5)
            elif spec.id == "first_try_5":
                unlocked = first_try_pass_count >= 5
                prog = self._progress(min(first_try_pass_count, 5), 5)
            elif spec.id == "path_level_1":
                done, total = path_progress_by_level.get(1, (0, 0))
                unlocked = total > 0 and done >= total
                prog = self._progress(done, total)
            elif spec.id == "path_level_2":
                done, total = path_progress_by_level.get(2, (0, 0))
                unlocked = total > 0 and done >= total
                prog = self._progress(done, total)
            elif spec.id == "path_level_3":
                done, total = path_progress_by_level.get(3, (0, 0))
                unlocked = total > 0 and done >= total
                prog = self._progress(done, total)
            else:
                unlocked = False
                prog = None

            out.append(
                AchievementOut(
                    id=spec.id,
                    title=spec.title,
                    description=spec.description,
                    icon_key=spec.icon_key,
                    xp=spec.xp,
                    rarity=spec.rarity,
                    unlocked=unlocked,
                    progress=prog,
                )
            )

        return out
