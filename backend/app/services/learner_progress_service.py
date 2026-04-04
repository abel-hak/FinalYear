"""Learner progression orchestration for quests and progress endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.learner_repository import LearnerRepository
from app.repositories.progress_repository import ProgressRepository
from app.schemas.progress import ProgressSummary, ReviewSuggestion
from app.schemas.quest import QuestDetail, QuestSummary


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

    @staticmethod
    def _build_statuses(ordered_quest_ids: list, completed_ids: set) -> dict:
        statuses: dict = {}
        previous_completed = True
        current_assigned = False
        for qid in ordered_quest_ids:
            if qid in completed_ids:
                statuses[qid] = "completed"
            elif previous_completed and not current_assigned:
                statuses[qid] = "current"
                current_assigned = True
                previous_completed = False
            else:
                statuses[qid] = "locked"
                previous_completed = False
        return statuses

    async def _load_progress_state(self, user_id):
        learner = await self.learner_repo.get_or_create_active_by_user_id(user_id)
        quests = await self.progress_repo.list_active_quests_ordered()
        ordered_ids = [q.id for q in quests]
        completed_ids = await self.progress_repo.get_completed_quest_ids_for_learner(learner.id)
        statuses = self._build_statuses(ordered_ids, completed_ids)
        return learner, quests, ordered_ids, completed_ids, statuses

    async def list_quests_for_user(self, user_id) -> list[QuestSummary]:
        _, quests, _, _, statuses = await self._load_progress_state(user_id)
        return [
            QuestSummary(
                id=q.id,
                title=q.title,
                description=q.description,
                level=q.level,
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
                order_rank=q.order_rank,
                status=statuses.get(q.id, "locked"),
                tags=q.tags if q.tags else [],
            )
            for q in quests
        ]
        last_activity = learner.last_activity_date.isoformat() if learner.last_activity_date else None
        return ProgressSummary(
            current_level=learner.current_level,
            total_points=learner.total_points,
            streak_days=learner.streak_days,
            last_activity_date=last_activity,
            quests=summaries,
        )

    async def get_quest_detail_for_user(self, user_id, quest_id) -> QuestDetail:
        learner, quests, ordered_ids, _, statuses = await self._load_progress_state(user_id)

        quest = await self.progress_repo.get_active_quest_by_id(quest_id)
        if not quest:
            raise QuestNotFoundError("Quest not found")

        if statuses.get(quest.id) == "locked":
            raise QuestLockedError("Quest is locked. Complete the current quest to unlock it.")

        completed = await self.progress_repo.has_passed_submission(learner.id, quest.id)

        prev_id = None
        next_id = None
        if quest.id in ordered_ids:
            idx = ordered_ids.index(quest.id)
            if idx > 0:
                candidate = ordered_ids[idx - 1]
                if statuses.get(candidate) != "locked":
                    prev_id = candidate
            if idx < len(ordered_ids) - 1:
                candidate = ordered_ids[idx + 1]
                if statuses.get(candidate) != "locked":
                    next_id = candidate

        return QuestDetail(
            id=quest.id,
            title=quest.title,
            description=quest.description,
            level=quest.level,
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
