"""
Learner progress API.

Returns:
- current_level
- total_points
- quests with status (completed/current/locked)
- review_suggestions (spaced repetition: quests completed 7+ days ago)
"""
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.submission import Submission
from app.schemas.progress import ProgressSummary, ReviewSuggestion
from app.services.learner_progress_service import LearnerProgressService


router = APIRouter(prefix="/progress", tags=["progress"])

# Spaced repetition: suggest revisiting quests completed this many days ago
REVIEW_INTERVAL_DAYS = 7


@router.get("", response_model=ProgressSummary)
async def get_progress(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Return learner's level, points, and quest statuses."""
    service = LearnerProgressService(db)
    return await service.get_progress_summary(current_user.id)


@router.get("/review-suggestions", response_model=List[ReviewSuggestion])
async def get_review_suggestions(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    Spaced repetition: suggest quests the learner completed 7+ days ago
    to reinforce concepts. Sorted by oldest completion first (most urgent).
    """
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=REVIEW_INTERVAL_DAYS)

    # Subquery: last passed submission per (learner, quest)
    subq = (
        select(
            Submission.quest_id,
            func.max(Submission.created_at).label("last_passed"),
        )
        .where(
            Submission.learner_id == learner.id,
            Submission.passed.is_(True),
        )
        .group_by(Submission.quest_id)
    ).subquery()

    # Join with Quest: only quests where last_passed <= cutoff (7+ days ago)
    result = await db.execute(
        select(Quest, subq.c.last_passed)
        .join(subq, Quest.id == subq.c.quest_id)
        .where(
            Quest.is_deleted.is_(False),
            subq.c.last_passed <= cutoff,
        )
        .order_by(subq.c.last_passed.asc())
    )
    rows = result.all()

    suggestions: list[ReviewSuggestion] = []
    now = datetime.now(timezone.utc)
    for q, last_passed in rows:
        delta = now - (last_passed if last_passed.tzinfo else last_passed.replace(tzinfo=timezone.utc))
        days_since = max(0, delta.days)
        suggestions.append(
            ReviewSuggestion(
                id=str(q.id),
                title=q.title,
                description=q.description,
                level=q.level,
                order_rank=q.order_rank,
                tags=q.tags if q.tags else [],
                last_completed_at=last_passed.isoformat() if last_passed.tzinfo else last_passed.replace(tzinfo=timezone.utc).isoformat(),
                days_since_completion=days_since,
            )
        )
    return suggestions

