"""
Achievements API.

Computed achievements derived from:
- quest completions (submissions)
- AI hint usage (hint_requests)
- learner streak and level
- learning path completion
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_learner
from app.db.session import get_db
from app.models.user import User
from app.schemas.achievement import AchievementOut
from app.services.achievement_service import AchievementService

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
async def list_achievements(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> list[AchievementOut]:
    service = AchievementService(db)
    return await service.list_achievements_for_user(current_user.id)

