"""
Admin APIs for managing quests and test cases.
Requires admin role (RBAC enforced via get_current_admin).
"""
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.db.session import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.learner import Learner
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission
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

