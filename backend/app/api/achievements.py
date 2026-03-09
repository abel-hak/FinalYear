"""
Achievements API.

Computed achievements derived from:
- quest completions (submissions)
- AI hint usage (hint_requests)
- learner streak and level
- learning path completion
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_learner
from app.db.session import get_db
from app.models.hint_request import HintRequest
from app.models.learner import Learner
from app.models.learning_path import LearningPath
from app.models.quest import Quest
from app.models.submission import Submission
from app.models.user import User
from app.schemas.achievement import AchievementOut, AchievementProgress

router = APIRouter(prefix="/achievements", tags=["achievements"])


@dataclass(frozen=True)
class _AchSpec:
    id: str
    title: str
    description: str
    icon_key: str
    xp: int
    rarity: str


ACHIEVEMENTS: list[_AchSpec] = [
    _AchSpec("first_fix", "First Fix", "Complete your first quest", "bug", 50, "common"),
    _AchSpec("quest_5", "Getting Started", "Complete 5 quests", "target", 150, "rare"),
    _AchSpec("quest_10", "Bug Hunter", "Complete 10 quests", "trophy", 250, "epic"),
    _AchSpec("quest_25", "Debugger", "Complete 25 quests", "star", 400, "legendary"),
    _AchSpec("quest_all", "Path Complete", "Complete all available quests", "code", 500, "legendary"),
    _AchSpec("level_2", "Level Up", "Reach Level 2", "zap", 150, "rare"),
    _AchSpec("level_3", "Advanced Learner", "Reach Level 3", "sparkles", 250, "epic"),
    _AchSpec("streak_3", "On a Roll", "Maintain a 3‑day streak", "flame", 100, "rare"),
    _AchSpec("streak_7", "Consistent", "Maintain a 7‑day streak", "flame", 250, "epic"),
    _AchSpec("streak_14", "Unstoppable", "Maintain a 14‑day streak", "flame", 500, "legendary"),
    _AchSpec("ai_hint_first", "Ask for Help", "Use your first AI hint", "sparkles", 50, "common"),
    _AchSpec("no_ai_hints_1", "No‑Hint Hero", "Complete 1 quest without AI hints", "shield", 150, "rare"),
    _AchSpec("no_ai_hints_5", "Pure Skill", "Complete 5 quests without AI hints", "shield", 350, "epic"),
    _AchSpec("first_try_5", "First‑Try Finisher", "Pass 5 quests on your first submission", "check", 300, "epic"),
    _AchSpec("path_level_1", "Basics Path Complete", "Complete the Level 1 learning path", "book", 200, "rare"),
    _AchSpec("path_level_2", "Intermediate Path Complete", "Complete the Level 2 learning path", "book", 350, "epic"),
    _AchSpec("path_level_3", "Advanced Path Complete", "Complete the Level 3 learning path", "book", 500, "legendary"),
]


@router.get("", response_model=list[AchievementOut])
async def list_achievements(
    current_user: User = Depends(get_current_learner),
    db: AsyncSession = Depends(get_db),
) -> list[AchievementOut]:
    # Resolve learner
    learner_row = await db.execute(
        select(Learner).where(Learner.user_id == current_user.id, Learner.is_deleted.is_(False))
    )
    learner = learner_row.scalar_one()

    # Quests
    quests_result = await db.execute(
        select(Quest).where(Quest.is_deleted.is_(False)).order_by(Quest.order_rank)
    )
    quests = list(quests_result.scalars().all())
    total_quests = len(quests)

    # Submissions (for completion + first-try)
    subs_result = await db.execute(
        select(Submission)
        .where(Submission.learner_id == learner.id)
        .order_by(Submission.quest_id, Submission.created_at)
    )
    subs = list(subs_result.scalars().all())

    completed_ids: set = {s.quest_id for s in subs if s.passed}
    completed_count = len(completed_ids)

    first_try_pass_count = 0
    seen_first: set = set()
    for s in subs:
        if s.quest_id in seen_first:
            continue
        seen_first.add(s.quest_id)
        if s.passed:
            first_try_pass_count += 1

    # AI hints
    hint_rows = await db.execute(
        select(HintRequest.quest_id).where(HintRequest.learner_id == learner.id)
    )
    hinted_quest_ids = {row[0] for row in hint_rows.all()}
    ai_hint_count = len(hinted_quest_ids) if hinted_quest_ids else 0

    # Completed quests with no AI hints
    completed_no_ai_hint_count = len([qid for qid in completed_ids if qid not in hinted_quest_ids])

    # Learning paths completion
    paths_result = await db.execute(
        select(LearningPath)
        .options(selectinload(LearningPath.path_quests))
        .order_by(LearningPath.level, LearningPath.order_rank)
    )
    paths = list(paths_result.scalars().all())
    path_progress_by_level: dict[int, tuple[int, int]] = {}  # level -> (completed, total)
    for p in paths:
        quest_ids = [pq.quest_id for pq in (p.path_quests or [])]
        if not quest_ids:
            continue
        done = sum(1 for qid in quest_ids if qid in completed_ids)
        path_progress_by_level[p.level] = (done, len(quest_ids))

    def make_progress(current: int, max_v: int) -> AchievementProgress:
        return AchievementProgress(current=int(current), max=int(max_v or 1))

    out: list[AchievementOut] = []
    for spec in ACHIEVEMENTS:
        if spec.id == "first_fix":
            cur, mx = min(completed_count, 1), 1
            unlocked = completed_count >= 1
            prog = make_progress(cur, mx)
        elif spec.id == "quest_5":
            cur, mx = min(completed_count, 5), 5
            unlocked = completed_count >= 5
            prog = make_progress(cur, mx)
        elif spec.id == "quest_10":
            cur, mx = min(completed_count, 10), 10
            unlocked = completed_count >= 10
            prog = make_progress(cur, mx)
        elif spec.id == "quest_25":
            cur, mx = min(completed_count, 25), 25
            unlocked = completed_count >= 25
            prog = make_progress(cur, mx)
        elif spec.id == "quest_all":
            cur, mx = completed_count, total_quests
            unlocked = total_quests > 0 and completed_count >= total_quests
            prog = make_progress(cur, mx)
        elif spec.id == "level_2":
            cur, mx = min(int(learner.current_level), 2), 2
            unlocked = int(learner.current_level) >= 2
            prog = make_progress(cur, mx)
        elif spec.id == "level_3":
            cur, mx = min(int(learner.current_level), 3), 3
            unlocked = int(learner.current_level) >= 3
            prog = make_progress(cur, mx)
        elif spec.id == "streak_3":
            cur, mx = min(int(learner.streak_days or 0), 3), 3
            unlocked = (learner.streak_days or 0) >= 3
            prog = make_progress(cur, mx)
        elif spec.id == "streak_7":
            cur, mx = min(int(learner.streak_days or 0), 7), 7
            unlocked = (learner.streak_days or 0) >= 7
            prog = make_progress(cur, mx)
        elif spec.id == "streak_14":
            cur, mx = min(int(learner.streak_days or 0), 14), 14
            unlocked = (learner.streak_days or 0) >= 14
            prog = make_progress(cur, mx)
        elif spec.id == "ai_hint_first":
            cur, mx = min(ai_hint_count, 1), 1
            unlocked = ai_hint_count >= 1
            prog = make_progress(cur, mx)
        elif spec.id == "no_ai_hints_1":
            cur, mx = min(completed_no_ai_hint_count, 1), 1
            unlocked = completed_no_ai_hint_count >= 1
            prog = make_progress(cur, mx)
        elif spec.id == "no_ai_hints_5":
            cur, mx = min(completed_no_ai_hint_count, 5), 5
            unlocked = completed_no_ai_hint_count >= 5
            prog = make_progress(cur, mx)
        elif spec.id == "first_try_5":
            cur, mx = min(first_try_pass_count, 5), 5
            unlocked = first_try_pass_count >= 5
            prog = make_progress(cur, mx)
        elif spec.id == "path_level_1":
            done, total = path_progress_by_level.get(1, (0, 0))
            unlocked = total > 0 and done >= total
            prog = make_progress(done, total)
        elif spec.id == "path_level_2":
            done, total = path_progress_by_level.get(2, (0, 0))
            unlocked = total > 0 and done >= total
            prog = make_progress(done, total)
        elif spec.id == "path_level_3":
            done, total = path_progress_by_level.get(3, (0, 0))
            unlocked = total > 0 and done >= total
            prog = make_progress(done, total)
        else:
            unlocked = False
            prog = None

        out.append(
            AchievementOut(
                id=spec.id,
                title=spec.title,
                description=spec.description,
                icon_key=spec.icon_key,
                xp=spec.xp,
                rarity=spec.rarity,
                unlocked=unlocked,
                progress=prog,
            )
        )

    return out

