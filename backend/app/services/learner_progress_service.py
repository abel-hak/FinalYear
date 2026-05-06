"""Learner progression orchestration for quests and progress endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.learner_repository import LearnerRepository
from app.repositories.progress_repository import ProgressRepository
from app.schemas.progress import ProgressSummary, ReviewSuggestion
from app.schemas.quest import QuestDetail, QuestSummary
from app.services.points_service import PointsService


@dataclass
class QuestNotFoundError(Exception):
    message: str


@dataclass
class QuestLockedError(Exception):
    message: str


class LearnerProgressService:
    """Application service for learner progression and quest visibility."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.learner_repo = LearnerRepository(db)
        self.progress_repo = ProgressRepository(db)
        self.points_service = PointsService(db)

    @staticmethod
    def _build_statuses_per_language(quests: list, completed_ids: set) -> dict:
        """Compute completed/current/locked statuses scoped per language.

        Each language progresses independently: e.g. completing all Python
        quests does not unlock Java, and vice versa. Within a language the
        usual linear rule applies — exactly one "current" quest, everything
        after it is locked until the previous one is completed.
        """
        # Group quests by language while preserving order_rank ordering.
        by_language: dict[str, list] = {}
        for q in quests:
            lang = (getattr(q, "language", None) or "python").lower()
            by_language.setdefault(lang, []).append(q)

        statuses: dict = {}
        for lang_quests in by_language.values():
            previous_completed = True
            current_assigned = False
            for q in lang_quests:
                if q.id in completed_ids:
                    statuses[q.id] = "completed"
                elif previous_completed and not current_assigned:
                    statuses[q.id] = "current"
                    current_assigned = True
                    previous_completed = False
                else:
                    statuses[q.id] = "locked"
                    previous_completed = False
        return statuses

    async def _load_progress_state(self, user_id):
        learner = await self.learner_repo.get_or_create_active_by_user_id(user_id)
        quests = await self.progress_repo.list_active_quests_ordered()
        ordered_ids = [q.id for q in quests]
        completed_ids = await self.progress_repo.get_completed_quest_ids_for_learner(learner.id)
        statuses = self._build_statuses_per_language(quests, completed_ids)
        return learner, quests, ordered_ids, completed_ids, statuses

    async def list_quests_for_user(self, user_id) -> list[QuestSummary]:
        _, quests, _, _, statuses = await self._load_progress_state(user_id)
        return [
            QuestSummary(
                id=q.id,
                title=q.title,
                description=q.description,
                level=q.level,
                xp_reward=getattr(q, "xp_reward", 10) or 10,
                language=getattr(q, "language", None) or "python",
                order_rank=q.order_rank,
                status=statuses.get(q.id, "locked"),
                tags=q.tags if q.tags else [],
            )
            for q in quests
        ]

    async def get_progress_summary(self, user_id) -> ProgressSummary:
        learner, quests, _, _, statuses = await self._load_progress_state(user_id)
        summaries = [
            QuestSummary(
                id=q.id,
                title=q.title,
                description=q.description,
                level=q.level,
                xp_reward=getattr(q, "xp_reward", 10) or 10,
                language=getattr(q, "language", None) or "python",
                order_rank=q.order_rank,
                status=statuses.get(q.id, "locked"),
                tags=q.tags if q.tags else [],
            )
            for q in quests
        ]
        last_activity = learner.last_activity_date.isoformat() if learner.last_activity_date else None
        return ProgressSummary(
            current_level=learner.current_level,
            total_points=await self.points_service.get_lifetime_points_for_user(user_id),
            streak_days=learner.streak_days,
            last_activity_date=last_activity,
            quests=summaries,
        )

    async def get_quest_detail_for_user(self, user_id, quest_id) -> QuestDetail:
        learner, quests, _, _, statuses = await self._load_progress_state(user_id)

        quest = await self.progress_repo.get_active_quest_by_id(quest_id)
        if not quest:
            raise QuestNotFoundError("Quest not found")

        if statuses.get(quest.id) == "locked":
            raise QuestLockedError("Quest is locked. Complete the current quest to unlock it.")

        completed = await self.progress_repo.has_passed_submission(learner.id, quest.id)

        # prev/next must only point to the previous/next quest in the SAME
        # language so a learner on the last Python quest does not jump into a
        # Java quest (and vice versa).
        quest_lang = (getattr(quest, "language", None) or "python").lower()
        same_lang_ids = [
            q.id
            for q in quests
            if (getattr(q, "language", None) or "python").lower() == quest_lang
        ]

        prev_id = None
        next_id = None
        if quest.id in same_lang_ids:
            idx = same_lang_ids.index(quest.id)
            if idx > 0:
                candidate = same_lang_ids[idx - 1]
                if statuses.get(candidate) != "locked":
                    prev_id = candidate
            if idx < len(same_lang_ids) - 1:
                candidate = same_lang_ids[idx + 1]
                if statuses.get(candidate) != "locked":
                    next_id = candidate

        return QuestDetail(
            id=quest.id,
            title=quest.title,
            description=quest.description,
            level=quest.level,
            xp_reward=getattr(quest, "xp_reward", 10) or 10,
            language=getattr(quest, "language", None) or "python",
            order_rank=quest.order_rank,
            initial_code=quest.initial_code,
            explanation_unlocked=completed,
            explanation=quest.explanation if completed else None,
            tags=quest.tags if quest.tags else [],
            prev_id=prev_id,
            next_id=next_id,
        )

    async def get_review_suggestions_for_user(self, user_id, review_interval_days: int = 7) -> list[ReviewSuggestion]:
        learner = await self.learner_repo.get_active_by_user_id(user_id)
        if not learner:
            return []

        cutoff = datetime.now(timezone.utc) - timedelta(days=review_interval_days)
        rows = await self.progress_repo.list_review_candidates_for_learner(learner.id, cutoff)

        now = datetime.now(timezone.utc)
        suggestions: list[ReviewSuggestion] = []
        for quest, last_passed in rows:
            if not last_passed:
                continue
            delta = now - last_passed
            suggestions.append(
                ReviewSuggestion(
                    id=str(quest.id),
                    title=quest.title,
                    description=quest.description,
                    level=quest.level,
                    order_rank=quest.order_rank,
                    tags=quest.tags if quest.tags else [],
                    last_completed_at=last_passed.isoformat(),
                    days_since_completion=max(0, delta.days),
                )
            )
        return suggestions
