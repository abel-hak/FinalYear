"""
Learning paths API - curated sequences of quests for specific goals.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.security import get_current_learner, get_current_learner_optional
from app.models.user import User
from app.schemas.learning_path import (
    LearningPathSummary,
    LearningPathDetail,
)
from app.services.learning_path_service import LearningPathNotFoundError, LearningPathService

router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])


@router.get("", response_model=List[LearningPathSummary])
async def list_learning_paths(
    current_user: User | None = Depends(get_current_learner_optional),
    db: AsyncSession = Depends(get_db),
):
    """List learning paths. When authenticated, returns unlocked status (Level N unlocks when N-1 complete)."""
    service = LearningPathService(db)
    return await service.list_paths(current_user=current_user)


@router.get("/{path_id}", response_model=LearningPathDetail)
async def get_learning_path(
    path_id: str,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """Get path with quests; quest status reflects learner progress."""
    service = LearningPathService(db)
    try:
        return await service.get_path_detail(path_id=path_id, user_id=current_user.id)
    except LearningPathNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
