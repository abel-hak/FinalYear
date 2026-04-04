"""
Admin APIs for managing quests and test cases.
Requires admin role (RBAC enforced via get_current_admin).
"""
# pylint: disable=not-callable,unused-argument
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission
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
    # Total learners
    learners_count = await db.execute(
        select(func.count(Learner.id)).where(Learner.is_deleted.is_(False))
    )
    total_users = learners_count.scalar() or 0

    # Total quests (non-deleted)
    quests_count = await db.execute(
        select(func.count(Quest.id)).where(Quest.is_deleted.is_(False))
    )
    total_quests = quests_count.scalar() or 0

    # Distinct (learner_id, quest_id) where passed
    subq = (
        select(Submission.learner_id, Submission.quest_id)
        .where(Submission.passed.is_(True))
        .distinct()
    )
    completed_count = await db.execute(select(func.count()).select_from(subq.subquery()))
    quests_completed = completed_count.scalar() or 0

    # Completion rate: completed / (learners * quests) or 0
    possible = total_users * total_quests if total_quests else 0
    completion_rate_pct = (quests_completed / possible * 100) if possible else 0.0

    return AdminStats(
        total_users=total_users,
        quests_completed=quests_completed,
        total_quests=total_quests,
        completion_rate_pct=round(completion_rate_pct, 1),
    )


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
    quests = await db.execute(
        select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
    )
    quest_list = list(quests.scalars().all())

    quest_completion = []
    for q in quest_list:
        passed = await db.execute(
            select(func.count(Submission.id)).where(
                Submission.quest_id == q.id, Submission.passed.is_(True)
            )
        )
        failed = await db.execute(
            select(func.count(Submission.id)).where(
                Submission.quest_id == q.id, Submission.passed.is_(False)
            )
        )
        quest_completion.append(
            AdminQuestCompletion(
                quest_id=str(q.id),
                quest_title=q.title[:30] + ("..." if len(q.title) > 30 else ""),
                completed=passed.scalar() or 0,
                failed=failed.scalar() or 0,
            )
        )

    level_counts = await db.execute(
        select(Quest.level, func.count(Quest.id))
        .where(Quest.is_deleted.is_(False))
        .group_by(Quest.level)
    )
    level_map = {1: "Easy", 2: "Medium", 3: "Hard", 4: "Expert", 5: "Master"}
    difficulty_distribution = [
        AdminDifficultyDistribution(
            level=lev,
            label=level_map.get(lev, f"Level {lev}"),
            count=cnt,
        )
        for lev, cnt in level_counts.all()
    ]

    now = datetime.now(timezone.utc)
    weekly_activity = []
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        day_start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        sub_count = await db.execute(
            select(func.count(Submission.id)).where(
                Submission.created_at >= day_start,
                Submission.created_at < day_end,
            )
        )
        user_count = await db.execute(
            select(func.count(Submission.learner_id.distinct())).where(
                Submission.created_at >= day_start,
                Submission.created_at < day_end,
            )
        )
        weekly_activity.append(
            AdminDailyActivity(
                day=day_names[d.weekday()],
                date=d.strftime("%Y-%m-%d"),
                submissions=sub_count.scalar() or 0,
                unique_users=user_count.scalar() or 0,
            )
        )

    return AdminAnalytics(
        quest_completion=quest_completion,
        difficulty_distribution=difficulty_distribution,
        weekly_activity=weekly_activity,
    )


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
    q_result = await db.execute(
        select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
    )
    quests = list(q_result.scalars().all())

    tc_counts_result = await db.execute(
        select(TestCase.quest_id, func.count(TestCase.id))
        .where(TestCase.is_deleted.is_(False))
        .group_by(TestCase.quest_id)
    )
    tc_counts = {qid: int(cnt) for (qid, cnt) in tc_counts_result.all()}

    items: list[QuestQualityIssue] = []
    for q in quests:
        issues: list[str] = []
        if not q.title or not q.title.strip():
            issues.append("Missing title")
        if not q.description or not q.description.strip():
            issues.append("Missing description")
        if not q.initial_code or not q.initial_code.strip():
            issues.append("Missing initial_code")
        if not q.solution_code or not q.solution_code.strip():
            issues.append("Missing solution_code")
        if not q.explanation or not q.explanation.strip():
            issues.append("Missing explanation")
        if not q.tags or len(q.tags) == 0:
            issues.append("Missing tags")
        if tc_counts.get(q.id, 0) <= 0:
            issues.append("No test cases")

        if issues:
            items.append(
                QuestQualityIssue(
                    quest_id=q.id,
                    order_rank=int(q.order_rank),
                    title=q.title,
                    issues=issues,
                )
            )

    return QuestQualityReport(
        total_quests=len(quests),
        quests_with_issues=len(items),
        items=items,
    )


@router.post("/quests/ai-draft", response_model=AdminQuestAIDraftResponse)
async def ai_draft_quest(
    payload: AdminQuestAIDraftRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    draft = await generate_admin_quest_draft(
        topic=payload.topic,
        difficulty=payload.difficulty,
        bug_type=payload.bug_type,
        extra_instructions=payload.extra_instructions,
    )

    # Minimal validation + normalization
    def _s(key: str) -> str:
        v = draft.get(key, "")
        if not isinstance(v, str):
            return ""
        return v.strip()

    level = int(draft.get("level") or payload.difficulty or 1)
    level = 1 if level < 1 else 3 if level > 3 else level
    tags = draft.get("tags") or []
    if not isinstance(tags, list):
        tags = []
    tags = [str(t).strip().lower() for t in tags if str(t).strip()][:5]

    return AdminQuestAIDraftResponse(
        title=_s("title") or f"{payload.topic.title()} Debug Quest",
        description=_s("description") or f"Fix the bug related to {payload.topic}.",
        level=level,
        initial_code=_s("initial_code"),
        solution_code=_s("solution_code"),
        explanation=_s("explanation"),
        expected_output=_s("expected_output"),
        tags=tags,
    )


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
    result = await db.execute(select(Quest).where(Quest.id == quest_id))
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(quest, field, value)

    await db.commit()
    await db.refresh(quest)
    return quest


@router.delete("/quests/{quest_id}", status_code=204)
async def delete_quest_admin(
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a quest."""
    result = await db.execute(select(Quest).where(Quest.id == quest_id))
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    quest.is_deleted = True
    await db.commit()
    return


@router.get("/quests/{quest_id}/testcases", response_model=List[TestCaseAdmin])
async def list_test_cases_admin(
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List test cases for a quest."""
    result = await db.execute(
        select(TestCase).where(TestCase.quest_id == quest_id, TestCase.is_deleted.is_(False))
    )
    return result.scalars().all()


@router.post("/quests/{quest_id}/testcases", response_model=TestCaseAdmin, status_code=201)
async def create_test_case_admin(
    quest_id: UUID4,
    payload: TestCaseCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new test case for a quest."""
    # Ensure quest exists
    result = await db.execute(select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False)))
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    tc = TestCase(
        quest_id=quest.id,
        input_data=payload.input_data,
        expected_output=payload.expected_output,
        is_hidden=payload.is_hidden,
    )
    db.add(tc)
    await db.flush()  # Get tc.id before response; get_db will commit
    await db.refresh(tc)
    return tc


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
    result = await db.execute(select(TestCase).where(TestCase.id == test_case_id))
    tc = result.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    tc.is_deleted = True
    await db.commit()
    return

