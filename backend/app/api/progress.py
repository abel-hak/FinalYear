"""Learner progress API."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_learner
from app.models.user import User
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
    """Spaced repetition: suggest quests completed before the review interval."""
    service = LearnerProgressService(db)
    return await service.get_review_suggestions_for_user(
        current_user.id,
        review_interval_days=REVIEW_INTERVAL_DAYS,
    )

