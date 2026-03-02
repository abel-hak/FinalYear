"""
Admin APIs for managing quests and test cases.
Requires admin role (RBAC enforced via get_current_admin).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.schemas.admin import (
    QuestCreate,
    QuestUpdate,
    QuestAdmin,
    TestCaseCreate,
    TestCaseAdmin,
)
from pydantic import UUID4


router = APIRouter(prefix="/admin", tags=["admin"])


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
    await db.commit()
    await db.refresh(tc)
    return tc


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

