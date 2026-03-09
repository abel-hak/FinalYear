"""
Admin APIs for managing quests and test cases.
Requires admin role (RBAC enforced via get_current_admin).
"""
# pylint: disable=not-callable,unused-argument
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission
from app.models.learning_path import LearningPath, LearningPathQuest
from app.config import get_settings
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
    total_quests_result = await db.execute(
        select(func.count(Quest.id)).where(Quest.is_deleted.is_(False))
    )
    total_quests = total_quests_result.scalar() or 0

    learners = await db.execute(
        select(User, Learner)
        .join(Learner, Learner.user_id == User.id)
        .where(User.role == "learner", User.is_deleted.is_(False), Learner.is_deleted.is_(False))
    )
    rows = learners.all()

    result = []
    for user, learner in rows:
        completed_q = await db.execute(
            select(func.count(Submission.quest_id.distinct()))
            .where(Submission.learner_id == learner.id, Submission.passed.is_(True))
        )
        quests_completed = completed_q.scalar() or 0

        last_sub = await db.execute(
            select(func.max(Submission.created_at)).where(Submission.learner_id == learner.id)
        )
        last_active = last_sub.scalar()

        result.append(
            AdminUserProgress(
                id=str(user.id),
                username=user.username,
                email=user.email,
                quests_completed=quests_completed,
                total_quests=total_quests,
                xp_earned=learner.total_points,
                last_active=last_active,
            )
        )
    return result


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
    result = await db.execute(select(Quest).order_by(Quest.order_rank))
    quests = result.scalars().all()
    return quests


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


@router.post("/quests", response_model=QuestAdmin, status_code=201)
async def create_quest_admin(
    payload: QuestCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new quest."""
    # Enforce unique order_rank at the application level so we can return a clear 400
    existing = await db.execute(
        select(Quest).where(Quest.order_rank == payload.order_rank, Quest.is_deleted.is_(False))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order {payload.order_rank} is already used by another quest. Choose a different order.",
        )

    quest = Quest(
        title=payload.title,
        description=payload.description,
        level=payload.level,
        order_rank=payload.order_rank,
        initial_code=payload.initial_code,
        solution_code=payload.solution_code,
        explanation=payload.explanation,
        tags=payload.tags or [],
    )
    db.add(quest)
    await db.commit()
    await db.refresh(quest)
    return quest


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
    result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.path_quests))
        .order_by(LearningPath.level, LearningPath.order_rank)
    )
    paths = list(result.scalars().all())
    return [
        LearningPathAdmin(
            id=p.id,
            title=p.title,
            description=p.description,
            level=p.level,
            order_rank=p.order_rank,
            quest_count=len(p.path_quests),
        )
        for p in paths
    ]


@router.post("/learning-paths", response_model=LearningPathAdmin, status_code=201)
async def create_learning_path_admin(
    payload: LearningPathCreate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new learning path."""
    path = LearningPath(
        title=payload.title,
        description=payload.description,
        level=payload.level,
        order_rank=payload.order_rank,
    )
    db.add(path)
    await db.commit()
    await db.refresh(path)
    return LearningPathAdmin(
        id=path.id,
        title=path.title,
        description=path.description,
        level=path.level,
        order_rank=path.order_rank,
        quest_count=0,
    )


@router.put("/learning-paths/{path_id}", response_model=LearningPathAdmin)
async def update_learning_path_admin(
    path_id: UUID4,
    payload: LearningPathUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update learning path fields."""
    result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.path_quests))
        .where(LearningPath.id == path_id)
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(path, field, value)

    await db.commit()
    await db.refresh(path)
    return LearningPathAdmin(
        id=path.id,
        title=path.title,
        description=path.description,
        level=path.level,
        order_rank=path.order_rank,
        quest_count=len(path.path_quests),
    )


@router.delete("/learning-paths/{path_id}", status_code=204)
async def delete_learning_path_admin(
    path_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a learning path and its quest assignments."""
    result = await db.execute(select(LearningPath).where(LearningPath.id == path_id))
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    await db.delete(path)
    await db.commit()
    return


@router.get("/learning-paths/{path_id}/quests", response_model=List[LearningPathQuestAdmin])
async def list_learning_path_quests_admin(
    path_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List quests in a learning path."""
    result = await db.execute(
        select(LearningPathQuest, Quest)
        .join(Quest, Quest.id == LearningPathQuest.quest_id)
        .where(LearningPathQuest.path_id == path_id, Quest.is_deleted.is_(False))
        .order_by(LearningPathQuest.order_rank)
    )
    rows = result.all()
    return [
        LearningPathQuestAdmin(
            id=pq.id,
            quest_id=pq.quest_id,
            order_rank=pq.order_rank,
            quest_title=q.title,
            quest_level=q.level,
        )
        for pq, q in rows
    ]


@router.post("/learning-paths/{path_id}/quests", response_model=LearningPathQuestAdmin, status_code=201)
async def add_quest_to_path_admin(
    path_id: UUID4,
    payload: LearningPathAddQuest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Add a quest to a learning path."""
    path_result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.path_quests))
        .where(LearningPath.id == path_id)
    )
    path = path_result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    quest_result = await db.execute(select(Quest).where(Quest.id == payload.quest_id, Quest.is_deleted.is_(False)))
    quest = quest_result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    existing = next((pq for pq in path.path_quests if pq.quest_id == payload.quest_id), None)
    if existing:
        raise HTTPException(status_code=400, detail="Quest already in this path")

    max_rank = max((pq.order_rank for pq in path.path_quests), default=0)
    order_rank = payload.order_rank if payload.order_rank is not None else max_rank + 1

    pq = LearningPathQuest(
        path_id=path_id,
        quest_id=payload.quest_id,
        order_rank=order_rank,
    )
    db.add(pq)
    await db.commit()
    await db.refresh(pq)
    return LearningPathQuestAdmin(
        id=pq.id,
        quest_id=pq.quest_id,
        order_rank=pq.order_rank,
        quest_title=quest.title,
        quest_level=quest.level,
    )


@router.delete("/learning-paths/{path_id}/quests/{quest_id}", status_code=204)
async def remove_quest_from_path_admin(
    path_id: UUID4,
    quest_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove a quest from a learning path."""
    result = await db.execute(
        select(LearningPathQuest).where(
            LearningPathQuest.path_id == path_id,
            LearningPathQuest.quest_id == quest_id,
        )
    )
    pq = result.scalar_one_or_none()
    if not pq:
        raise HTTPException(status_code=404, detail="Quest not in this path")

    await db.delete(pq)
    await db.commit()
    return


@router.post("/purge-submissions")
async def purge_submissions_admin(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Purge submissions older than retention period (NFR-11.2). Preserves progress."""
    retention_days = get_settings().submission_retention_days
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

    r1 = await db.execute(
        text("DELETE FROM submissions WHERE created_at < :cutoff AND passed = false"),
        {"cutoff": cutoff},
    )
    failed_deleted = r1.rowcount

    r2 = await db.execute(
        text("""
            DELETE FROM submissions s
            WHERE s.created_at < :cutoff AND s.passed = true
            AND EXISTS (
                SELECT 1 FROM submissions s2
                WHERE s2.learner_id = s.learner_id AND s2.quest_id = s.quest_id
                AND s2.passed = true AND s2.created_at >= :cutoff
            )
        """),
        {"cutoff": cutoff},
    )
    passed_deleted = r2.rowcount

    await db.commit()
    return {"purged": failed_deleted + passed_deleted, "retention_days": retention_days}


@router.delete("/users/{user_id}", status_code=204)
async def remove_learner_admin(
    user_id: UUID4,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove a learner (soft-delete User and Learner). US-014."""
    result = await db.execute(
        select(User, Learner)
        .outerjoin(Learner, Learner.user_id == User.id)
        .where(User.id == user_id, User.is_deleted.is_(False))
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    user, learner = row
    if user.role != "learner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only learners can be removed. Admins cannot be removed via this endpoint.",
        )

    now = datetime.now(timezone.utc)
    admin_id = current_admin.id

    user.is_deleted = True
    user.deleted_at = now
    user.deleted_by = admin_id

    if learner:
        learner.is_deleted = True
        learner.deleted_at = now
        learner.deleted_by = admin_id

    await db.commit()
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

