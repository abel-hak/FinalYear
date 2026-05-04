"""
Admin APIs for managing quests and test cases.
Requires admin role (RBAC enforced via get_current_admin).
"""
# pylint: disable=not-callable,unused-argument
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.config import get_settings
from app.core.ai import generate_admin_quest_draft
from app.services.admin_service import (
    AdminConflictError,
    AdminNotFoundError,
    AdminService,
    AdminValidationError,
)
from app.schemas.admin import (
    QuestCreate,
    QuestUpdate,
    QuestAdmin,
    TestCaseCreate,
    TestCaseAdmin,
    AdminStats,
    AdminUserProgress,
    AdminAnalytics,
    AdminQuestCompletion,
    AdminDifficultyDistribution,
    AdminDailyActivity,
    LearningPathCreate,
    LearningPathUpdate,
    LearningPathAdmin,
    LearningPathQuestAdmin,
    LearningPathAddQuest,
    QuestQualityIssue,
    QuestQualityReport,
)
from app.schemas.ai_admin import AdminQuestAIDraftRequest, AdminQuestAIDraftResponse
from pydantic import UUID4


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats: total users, quests completed, completion rate."""
    service = AdminService(db)
    return await service.get_stats()


@router.get("/users", response_model=List[AdminUserProgress])
async def list_admin_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List learners with progress for admin user table."""
    service = AdminService(db)
    return await service.list_users()


@router.get("/analytics", response_model=AdminAnalytics)
async def get_admin_analytics(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Analytics for charts: quest completion, difficulty, weekly activity."""
    service = AdminService(db)
    return await service.get_analytics()


@router.get("/quests", response_model=List[QuestAdmin])
async def list_quests_admin(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all quests for admin management."""
    service = AdminService(db)
    return await service.list_quests()


@router.get("/quests/quality", response_model=QuestQualityReport)
async def quest_quality_report(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Basic content quality checks for quests:
    - missing tags
    - missing explanation
    - missing solution code
    - missing test cases
    """
    service = AdminService(db)
    return await service.get_quest_quality_report()


@router.post("/quests/ai-draft", response_model=AdminQuestAIDraftResponse)
async def ai_draft_quest(
    payload: AdminQuestAIDraftRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.generate_ai_draft(
            payload=payload,
            draft_fn=generate_admin_quest_draft,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/quests", response_model=QuestAdmin, status_code=201)
async def create_quest_admin(
    payload: QuestCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new quest."""
    service = AdminService(db)
    try:
        return await service.create_quest(payload)
    except AdminConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc


@router.put("/quests/{quest_id}", response_model=QuestAdmin)
async def update_quest_admin(
    quest_id: UUID4,
    payload: QuestUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update quest fields."""
    service = AdminService(db)
    try:
        return await service.update_quest(quest_id=quest_id, payload=payload)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc


@router.delete("/quests/{quest_id}", status_code=204)
async def delete_quest_admin(
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a quest."""
    service = AdminService(db)
    try:
        await service.delete_quest(quest_id=quest_id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    return


@router.get("/quests/{quest_id}/testcases", response_model=List[TestCaseAdmin])
async def list_test_cases_admin(
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List test cases for a quest."""
    service = AdminService(db)
    return await service.list_test_cases(quest_id=quest_id)


@router.post("/quests/{quest_id}/testcases", response_model=TestCaseAdmin, status_code=201)
async def create_test_case_admin(
    quest_id: UUID4,
    payload: TestCaseCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new test case for a quest."""
    service = AdminService(db)
    try:
        return await service.create_test_case(quest_id=quest_id, payload=payload)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc


# --- Learning paths admin ---

@router.get("/learning-paths", response_model=List[LearningPathAdmin])
async def list_learning_paths_admin(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all learning paths for admin management."""
    service = AdminService(db)
    return await service.list_learning_paths()


@router.post("/learning-paths", response_model=LearningPathAdmin, status_code=201)
async def create_learning_path_admin(
    payload: LearningPathCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new learning path."""
    service = AdminService(db)
    return await service.create_learning_path(payload)


@router.put("/learning-paths/{path_id}", response_model=LearningPathAdmin)
async def update_learning_path_admin(
    path_id: UUID4,
    payload: LearningPathUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update learning path fields."""
    service = AdminService(db)
    try:
        return await service.update_learning_path(path_id=path_id, payload=payload)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc


@router.delete("/learning-paths/{path_id}", status_code=204)
async def delete_learning_path_admin(
    path_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a learning path and its quest assignments."""
    service = AdminService(db)
    try:
        await service.delete_learning_path(path_id=path_id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    return


@router.get("/learning-paths/{path_id}/quests", response_model=List[LearningPathQuestAdmin])
async def list_learning_path_quests_admin(
    path_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List quests in a learning path."""
    service = AdminService(db)
    return await service.list_learning_path_quests(path_id=path_id)


@router.post("/learning-paths/{path_id}/quests", response_model=LearningPathQuestAdmin, status_code=201)
async def add_quest_to_path_admin(
    path_id: UUID4,
    payload: LearningPathAddQuest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Add a quest to a learning path."""
    service = AdminService(db)
    try:
        return await service.add_quest_to_learning_path(path_id=path_id, payload=payload)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminConflictError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc


@router.delete("/learning-paths/{path_id}/quests/{quest_id}", status_code=204)
async def remove_quest_from_path_admin(
    path_id: UUID4,
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove a quest from a learning path."""
    service = AdminService(db)
    try:
        await service.remove_quest_from_learning_path(path_id=path_id, quest_id=quest_id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    return


@router.post("/purge-submissions")
async def purge_submissions_admin(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Purge submissions older than retention period (NFR-11.2). Preserves progress."""
    service = AdminService(db)
    retention_days = get_settings().submission_retention_days
    return await service.purge_submissions(retention_days)


@router.delete("/users/{user_id}", status_code=204)
async def remove_learner_admin(
    user_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove a learner (soft-delete User and Learner). US-014."""
    service = AdminService(db)
    try:
        await service.remove_learner(user_id=user_id, admin_id=current_admin.id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    except AdminValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc
    return


@router.delete("/testcases/{test_case_id}", status_code=204)
async def delete_test_case_admin(
    test_case_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a test case."""
    service = AdminService(db)
    try:
        await service.delete_test_case(test_case_id=test_case_id)
    except AdminNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.message) from exc
    return

