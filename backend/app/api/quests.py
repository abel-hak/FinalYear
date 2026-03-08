"""
Learner quest APIs.

- List quests with status: completed/current/locked
- Get quest detail (with initial_code; explanation only if completed)
"""
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_db
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.submission import Submission
from app.models.learner import Learner
from app.core.security import get_current_learner
from app.models.user import User
from app.schemas.quest import QuestSummary, QuestDetail
from app.schemas.execute import SubmissionRequest, SubmissionResult
from app.core.sandbox import run_python
from app.config import get_settings
from pydantic import UUID4


router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("", response_model=List[QuestSummary])
async def list_quests(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    List all quests in linear order with learner-specific status:
    - 'completed': learner has at least one passed submission
    - 'current': first quest not yet completed but previous is completed (or first quest)
    - 'locked': all others
    """
    # All quests ordered
    result = await db.execute(
        select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
    )
    quests: list[Quest] = list(result.scalars().all())

    # Resolve learner id (create if missing for admins)
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        learner = Learner(user_id=current_user.id)
        db.add(learner)
        await db.flush()
    learner_id = learner.id

    # Completed quest ids for this learner
    subq = (
        select(Submission.quest_id)
        .where(
            Submission.learner_id == learner_id,
            Submission.passed.is_(True),
        )
        .distinct()
    )
    completed_result = await db.execute(subq)
    completed_ids = {row[0] for row in completed_result.all()}

    summaries: list[QuestSummary] = []
    previous_completed = True
    current_assigned = False
    for q in quests:
        if q.id in completed_ids:
            status = "completed"
        elif previous_completed and not current_assigned:
            status = "current"
            current_assigned = True
            previous_completed = False
        else:
            status = "locked"
            previous_completed = False
        summaries.append(
            QuestSummary(
                id=q.id,
                title=q.title,
                description=q.description,
                level=q.level,
                order_rank=q.order_rank,
                status=status,
            )
        )
    return summaries


@router.get("/{quest_id}", response_model=QuestDetail)
async def get_quest(
    quest_id: UUID4,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    Get quest detail for a learner.
    - Always returns description and initial_code.
    - explanation is only included if learner has completed the quest.
    """
    result = await db.execute(
        select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False))
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    # Resolve learner id (create if missing for admins)
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        learner = Learner(user_id=current_user.id)
        db.add(learner)
        await db.flush()
    learner_id = learner.id

    # Has the learner completed this quest?
    sub = await db.execute(
        select(Submission)
        .where(
            Submission.learner_id == learner_id,
            Submission.quest_id == quest.id,
            Submission.passed.is_(True),
        )
        .limit(1)
    )
    completed = sub.scalar_one_or_none() is not None

    return QuestDetail(
        id=quest.id,
        title=quest.title,
        description=quest.description,
        level=quest.level,
        order_rank=quest.order_rank,
        initial_code=quest.initial_code,
        explanation_unlocked=completed,
        explanation=quest.explanation if completed else None,
    )


@router.post("/{quest_id}/submit", response_model=SubmissionResult)
async def submit_quest(
    quest_id: UUID4,
    payload: SubmissionRequest,
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit code for a quest:
    - Executes learner code in the sandbox.
    - Compares stdout to expected_output for each TestCase.
    - Stores a Submission row.
    - Updates learner progress (points) on first pass.
    """
    # Load quest and its test cases
    result = await db.execute(
        select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False))
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    tc_result = await db.execute(
        select(TestCase).where(TestCase.quest_id == quest.id, TestCase.is_deleted.is_(False))
    )
    test_cases: list[TestCase] = list(tc_result.scalars().all())
    if not test_cases:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System Busy. Please try again later.",
        )

    # Resolve learner early (needed for rate limit)
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one_or_none()
    if not learner:
        learner = Learner(user_id=current_user.id)
        db.add(learner)
        await db.flush()

    # Rate limit: N submissions per minute per learner (NFR-01.4, NFR-10.3)
    limit = get_settings().submission_rate_limit_per_minute
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    count_row = await db.execute(
        select(func.count())
        .select_from(Submission)
        .where(
            Submission.learner_id == learner.id,
            Submission.created_at >= cutoff,
        )
    )
    recent_count = int(count_row.scalar() or 0)
    if recent_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {limit} code submissions per minute. Please wait before trying again.",
        )

    # Run code once (MVP: test cases do not vary input)
    try:
        sandbox_result = run_python(payload.code, timeout_seconds=5)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System Busy. Please try again later.",
        )

    tests_total = len(test_cases)
    tests_passed = 0
    stdout = (sandbox_result.stdout or "").rstrip("\n")
    if not sandbox_result.timed_out and sandbox_result.exit_code == 0:
        for tc in test_cases:
            expected = (tc.expected_output or "").rstrip("\n")
            if stdout == expected:
                tests_passed += 1
    passed = tests_passed == tests_total and tests_total > 0

    # Check if learner already passed this quest before
    prev_pass = await db.execute(
        select(Submission)
        .where(
            Submission.learner_id == learner.id,
            Submission.quest_id == quest.id,
            Submission.passed.is_(True),
        )
        .limit(1)
    )
    already_completed = prev_pass.scalar_one_or_none() is not None

    # Store submission
    submission = Submission(
        learner_id=learner.id,
        quest_id=quest.id,
        code=payload.code,
        passed=passed,
        output_log=(sandbox_result.stdout or "") + (sandbox_result.stderr or ""),
    )
    db.add(submission)

    # Update learner progress (simple: +10 points for first completion)
    if passed and not already_completed:
        learner.total_points += 10
        if quest.level > learner.current_level:
            learner.current_level = quest.level

    # Update streak (any submission counts as activity)
    today = datetime.now(timezone.utc).date()
    last = learner.last_activity_date
    if last is None:
        learner.streak_days = 1
        learner.last_activity_date = today
    elif last == today:
        pass  # already counted today
    elif last == today - timedelta(days=1):
        learner.streak_days += 1
        learner.last_activity_date = today
    else:
        learner.streak_days = 1
        learner.last_activity_date = today

    try:
        await db.commit()
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System Busy. Please try again later.",
        )

    return SubmissionResult(
        quest_id=quest.id,
        passed=passed,
        tests_passed=tests_passed,
        tests_total=tests_total,
        stdout=sandbox_result.stdout,
        stderr=sandbox_result.stderr,
    )

