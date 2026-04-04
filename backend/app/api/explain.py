"""
AI-powered explanation for failed submissions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_learner
from app.core.ai import generate_failure_explanation
from app.models.user import User
from app.schemas.explain import ExplainFailureRequest, ExplainFailureResponse
from app.services.explain_service import (
    ExplainQuestNotFoundError,
    ExplainService,
    ExplainUnavailableError,
)
router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/explain-failure", response_model=ExplainFailureResponse)
async def explain_failure(
    payload: ExplainFailureRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> ExplainFailureResponse:
    service = ExplainService(db)
    try:
        return await service.explain_failure(
            payload=payload,
            explain_fn=generate_failure_explanation,
        )
    except ExplainQuestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except ExplainUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=exc.message,
        ) from exc

