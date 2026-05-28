"""Creator workspace APIs for managing assigned learning paths."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import (
    LearningPathAddQuest,
    LearningPathAdmin,
    LearningPathQuestAdmin,
    QuestCreate,
    QuestUpdate,
    QuestAdmin,
    LearningPathReorder,
)
from app.schemas.ai_admin import AdminQuestAIDraftRequest, AdminQuestAIDraftResponse
from app.schemas.creator import CreatorInvitationAcceptRequest
from app.services.admin_service import AdminConflictError, AdminNotFoundError, AdminPermissionError, AdminService, AdminValidationError


router = APIRouter(prefix="/creator", tags=["creator"])


@router.get("/learning-paths", response_model=List[LearningPathAdmin])
async def list_creator_learning_paths(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_learning_paths(creator_user_id=current_user.id)


@router.get("/learning-paths/{path_id}/quests", response_model=List[LearningPathQuestAdmin])
async def list_creator_learning_path_quests(
    path_id: UUID4,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.list_learning_path_quests(path_id=path_id, creator_user_id=current_user.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc


@router.post("/learning-paths/{path_id}/quests", response_model=LearningPathQuestAdmin, status_code=201)
async def add_creator_quest_to_path(
    path_id: UUID4,
    payload: LearningPathAddQuest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.add_quest_to_learning_path(path_id=path_id, payload=payload, creator_user_id=current_user.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except AdminPermissionError as exc:
        raise HTTPException(status_code=403, detail=exc.message) from exc


@router.delete("/learning-paths/{path_id}/quests/{quest_id}", status_code=204)
async def remove_creator_quest_from_path(
    path_id: UUID4,
    quest_id: UUID4,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        await service.remove_quest_from_learning_path(path_id=path_id, quest_id=quest_id, creator_user_id=current_user.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminPermissionError as exc:
        raise HTTPException(status_code=403, detail=exc.message) from exc
    return


@router.post("/invitations/accept", response_model=LearningPathAdmin)
async def accept_creator_invitation(
    payload: CreatorInvitationAcceptRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.accept_creator_invitation(token=payload.token, current_user=current_user)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message) from exc
    except AdminValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc


@router.post("/quests", response_model=QuestAdmin, status_code=201)
async def create_creator_quest(
    payload: QuestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.create_quest(payload, creator_user_id=current_user.id)


@router.get("/quests/{quest_id}", response_model=QuestAdmin)
async def get_creator_quest(
    quest_id: UUID4,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    quest = await service.repo.get_quest_by_id(quest_id)
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")
    allowed = await service.repo.is_quest_in_creator_paths(quest_id, current_user.id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creator permission required to view this quest")
    return quest


@router.post("/quests/ai-draft", response_model=AdminQuestAIDraftResponse)
async def creator_ai_draft(
    payload: AdminQuestAIDraftRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI draft for creators (reuses admin draft generator)."""
    service = AdminService(db)
    try:
        from app.core.ai import generate_admin_quest_draft

        return await service.generate_ai_draft(payload=payload, draft_fn=generate_admin_quest_draft)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.put("/quests/{quest_id}", response_model=QuestAdmin)
async def update_creator_quest(
    quest_id: UUID4,
    payload: QuestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.update_quest(quest_id=quest_id, payload=payload, creator_user_id=current_user.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminPermissionError as exc:
        raise HTTPException(status_code=403, detail=exc.message) from exc


@router.post("/learning-paths/{path_id}/quests/reorder", status_code=204)
async def reorder_creator_learning_path_quests(
    path_id: UUID4,
    payload: LearningPathReorder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        await service.reorder_learning_path_quests(path_id=path_id, payload=payload, creator_user_id=current_user.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminPermissionError as exc:
        raise HTTPException(status_code=403, detail=exc.message) from exc
    return