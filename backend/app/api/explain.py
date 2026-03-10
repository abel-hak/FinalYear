"""
AI-powered explanation for failed submissions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import get_current_learner
from app.core.ai import generate_failure_explanation
from app.models.quest import Quest
from app.models.user import User
from app.schemas.explain import ExplainFailureRequest, ExplainFailureResponse
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/explain-failure", response_model=ExplainFailureResponse)
async def explain_failure(
    payload: ExplainFailureRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> ExplainFailureResponse:
    # Ensure quest exists
    result = await db.execute(
        select(Quest).where(Quest.id == payload.quest_id, Quest.is_deleted.is_(False))
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    try:
        data = await generate_failure_explanation(
            quest_title=quest.title,
            quest_description=quest.description,
            learner_code=payload.code,
            expected_output=payload.expected_output,
            actual_output=payload.actual_output,
            stderr=payload.stderr,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return ExplainFailureResponse(
        what_it_does=str(data.get("what_it_does", "")).strip() or "Explanation not available.",
        why_wrong=str(data.get("why_wrong", "")).strip() or "Explanation not available.",
        next_action=str(data.get("next_action", "")).strip() or "Try checking the lines around the reported mismatch.",
    )

