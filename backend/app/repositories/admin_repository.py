"""Admin-oriented data access helpers for management workflows."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.learner import Learner
from app.models.learning_path import LearningPath, LearningPathQuest
from app.models.quest import Quest
from app.models.submission import Submission
from app.models.test_case import TestCase
from app.models.user import User


class AdminRepository:
    """Encapsulates DB operations used by admin services."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_quests_ordered(self):
        result = await self.db.execute(select(Quest).order_by(Quest.order_rank))
        return list(result.scalars().all())

    async def find_active_quest_with_order(self, order_rank: int):
        result = await self.db.execute(
            select(Quest).where(Quest.order_rank == order_rank, Quest.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def create_quest(self, *, payload):
        quest = Quest(
            title=payload.title,
            description=payload.description,
            level=payload.level,
            xp_reward=payload.xp_reward,
            order_rank=payload.order_rank,
            initial_code=payload.initial_code,
            solution_code=payload.solution_code,
            explanation=payload.explanation,
            tags=payload.tags or [],
        )
        self.db.add(quest)
        await self.db.commit()
        await self.db.refresh(quest)
        return quest

    async def count_active_quests(self) -> int:
        result = await self.db.execute(select(func.count(Quest.id)).where(Quest.is_deleted.is_(False)))
        return int(result.scalar() or 0)

    async def list_active_learner_pairs(self):
        result = await self.db.execute(
            select(User, Learner)
            .join(Learner, Learner.user_id == User.id)
            .where(User.role == "learner", User.is_deleted.is_(False), Learner.is_deleted.is_(False))
        )
        return result.all()

    async def count_completed_quests_for_learner(self, learner_id) -> int:
        result = await self.db.execute(
            select(func.count(Submission.quest_id.distinct())).where(
                Submission.learner_id == learner_id,
                Submission.passed.is_(True),
            )
        )
        return int(result.scalar() or 0)

    async def get_last_submission_at(self, learner_id):
        result = await self.db.execute(
            select(func.max(Submission.created_at)).where(Submission.learner_id == learner_id)
        )
        return result.scalar()

    async def purge_submissions_before(self, cutoff):
        r1 = await self.db.execute(
            text("DELETE FROM submissions WHERE created_at < :cutoff AND passed = false"),
            {"cutoff": cutoff},
        )
        r2 = await self.db.execute(
            text(
                """
                DELETE FROM submissions s
                WHERE s.created_at < :cutoff AND s.passed = true
                AND EXISTS (
                    SELECT 1 FROM submissions s2
                    WHERE s2.learner_id = s.learner_id AND s2.quest_id = s.quest_id
                    AND s2.passed = true AND s2.created_at >= :cutoff
                )
                """
            ),
            {"cutoff": cutoff},
        )
        await self.db.commit()
        return int(getattr(r1, "rowcount", 0) or 0), int(getattr(r2, "rowcount", 0) or 0)

    async def get_active_user_with_learner(self, user_id):
        result = await self.db.execute(
            select(User, Learner)
            .outerjoin(Learner, Learner.user_id == User.id)
            .where(User.id == user_id, User.is_deleted.is_(False))
        )
        return result.one_or_none()

    async def soft_delete_learner_user(self, *, user: User, learner: Learner | None, admin_id):
        now = datetime.now(timezone.utc)
        user.is_deleted = True
        user.deleted_at = now
        user.deleted_by = admin_id

        if learner:
            learner.is_deleted = True
            learner.deleted_at = now
            learner.deleted_by = admin_id

        await self.db.commit()

    async def list_learning_paths_with_quests(self) -> list[LearningPath]:
        result = await self.db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .order_by(LearningPath.level, LearningPath.order_rank)
        )
        return list(result.scalars().all())

    async def create_learning_path(self, *, payload) -> LearningPath:
        path = LearningPath(
            title=payload.title,
            description=payload.description,
            level=payload.level,
            order_rank=payload.order_rank,
        )
        self.db.add(path)
        await self.db.commit()
        await self.db.refresh(path)
        return path

    async def get_learning_path_with_quests(self, path_id) -> LearningPath | None:
        result = await self.db.execute(
            select(LearningPath)
            .options(selectinload(LearningPath.path_quests))
            .where(LearningPath.id == path_id)
        )
        return result.scalar_one_or_none()

    async def update_learning_path(self, *, path: LearningPath, updates: dict) -> LearningPath:
        for field, value in updates.items():
            setattr(path, field, value)
        await self.db.commit()
        await self.db.refresh(path)
        return path

    async def delete_learning_path(self, *, path: LearningPath) -> None:
        await self.db.delete(path)
        await self.db.commit()

    async def list_learning_path_quests(self, path_id):
        result = await self.db.execute(
            select(LearningPathQuest, Quest)
            .join(Quest, Quest.id == LearningPathQuest.quest_id)
            .where(LearningPathQuest.path_id == path_id, Quest.is_deleted.is_(False))
            .order_by(LearningPathQuest.order_rank)
        )
        return result.all()

    async def get_active_quest(self, quest_id) -> Quest | None:
        result = await self.db.execute(
            select(Quest).where(Quest.id == quest_id, Quest.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def add_learning_path_quest(self, *, path_id, quest_id, order_rank: int) -> LearningPathQuest:
        pq = LearningPathQuest(
            path_id=path_id,
            quest_id=quest_id,
            order_rank=order_rank,
        )
        self.db.add(pq)
        await self.db.commit()
        await self.db.refresh(pq)
        return pq

    async def get_learning_path_quest(self, *, path_id, quest_id) -> LearningPathQuest | None:
        result = await self.db.execute(
            select(LearningPathQuest).where(
                LearningPathQuest.path_id == path_id,
                LearningPathQuest.quest_id == quest_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete_learning_path_quest(self, *, path_quest: LearningPathQuest) -> None:
        await self.db.delete(path_quest)
        await self.db.commit()

    async def get_quest_by_id(self, quest_id) -> Quest | None:
        result = await self.db.execute(select(Quest).where(Quest.id == quest_id))
        return result.scalar_one_or_none()

    async def update_quest(self, *, quest: Quest, updates: dict) -> Quest:
        for field, value in updates.items():
            setattr(quest, field, value)
        await self.db.commit()
        await self.db.refresh(quest)
        return quest

    async def soft_delete_quest(self, *, quest: Quest) -> None:
        quest.is_deleted = True
        await self.db.commit()

    async def list_active_test_cases_for_quest(self, quest_id) -> list[TestCase]:
        result = await self.db.execute(
            select(TestCase).where(
                TestCase.quest_id == quest_id,
                TestCase.is_deleted.is_(False),
            )
        )
        return list(result.scalars().all())

    async def create_test_case(
        self,
        *,
        quest_id,
        input_data,
        expected_output: str,
        is_hidden: bool,
    ) -> TestCase:
        test_case = TestCase(
            quest_id=quest_id,
            input_data=input_data,
            expected_output=expected_output,
            is_hidden=is_hidden,
        )
        self.db.add(test_case)
        await self.db.flush()
        await self.db.refresh(test_case)
        return test_case

    async def get_test_case_by_id(self, test_case_id) -> TestCase | None:
        result = await self.db.execute(select(TestCase).where(TestCase.id == test_case_id))
        return result.scalar_one_or_none()

    async def soft_delete_test_case(self, *, test_case: TestCase) -> None:
        test_case.is_deleted = True
        await self.db.commit()

    async def count_active_learners(self) -> int:
        result = await self.db.execute(
            select(func.count(Learner.id)).where(Learner.is_deleted.is_(False))
        )
        return int(result.scalar() or 0)

    async def count_distinct_passed_pairs(self) -> int:
        subq = (
            select(Submission.learner_id, Submission.quest_id)
            .where(Submission.passed.is_(True))
            .distinct()
        )
        result = await self.db.execute(select(func.count()).select_from(subq.subquery()))
        return int(result.scalar() or 0)

    async def list_active_quests_ordered(self) -> list[Quest]:
        result = await self.db.execute(
            select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
        )
        return list(result.scalars().all())

    async def count_submissions_for_quest(self, quest_id, *, passed: bool) -> int:
        result = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.quest_id == quest_id,
                Submission.passed.is_(passed),
            )
        )
        return int(result.scalar() or 0)

    async def count_quests_grouped_by_level(self):
        result = await self.db.execute(
            select(Quest.level, func.count(Quest.id))
            .where(Quest.is_deleted.is_(False))
            .group_by(Quest.level)
        )
        return result.all()

    async def count_submissions_between(self, start_dt, end_dt) -> int:
        result = await self.db.execute(
            select(func.count(Submission.id)).where(
                Submission.created_at >= start_dt,
                Submission.created_at < end_dt,
            )
        )
        return int(result.scalar() or 0)

    async def count_unique_submission_learners_between(self, start_dt, end_dt) -> int:
        result = await self.db.execute(
            select(func.count(Submission.learner_id.distinct())).where(
                Submission.created_at >= start_dt,
                Submission.created_at < end_dt,
            )
        )
        return int(result.scalar() or 0)

    async def count_active_test_cases_by_quest(self) -> dict:
        result = await self.db.execute(
            select(TestCase.quest_id, func.count(TestCase.id))
            .where(TestCase.is_deleted.is_(False))
            .group_by(TestCase.quest_id)
        )
        return {quest_id: int(count) for quest_id, count in result.all()}
