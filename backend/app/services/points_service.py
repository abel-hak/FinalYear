"""XP aggregation helpers."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.learner_repository import LearnerRepository
from app.services.achievement_service import AchievementService


class PointsService:
    """Computes lifetime XP from quest points plus unlocked achievement XP."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.learner_repo = LearnerRepository(db)

    async def get_lifetime_points_for_user(self, user_id) -> int:
        learner = await self.learner_repo.get_active_by_user_id(user_id)
        if not learner:
            return 0

        achievements = await AchievementService(self.db).list_achievements_for_user(user_id)
        achievement_bonus = sum(int(achievement.xp or 0) for achievement in achievements if achievement.unlocked)
        return int(learner.total_points or 0) + achievement_bonus