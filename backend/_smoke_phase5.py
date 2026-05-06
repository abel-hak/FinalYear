"""
Phase 5 smoke test: per-language progression and path unlocking.

Verifies (against the actual DB, no HTTP layer):
  1. learner_progress_service.list_quests_for_user returns one "current" quest
     per language (not just one global "current").
  2. learning_path_service.list_paths surfaces the language for each path and
     correctly unlocks per-language (Java level 1 unlocked even though Python
     paths are not all complete).
  3. learning_path_service.get_path_detail returns the path's language and
     scopes the unlock check to the same language.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from uuid import UUID

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


# pylint: disable=wrong-import-position
from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.models.learning_path import LearningPath  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.learner_progress_service import LearnerProgressService  # noqa: E402
from app.services.learning_path_service import LearningPathService  # noqa: E402


def _async_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        # Fall back to sync url and adjust scheme.
        url = os.environ.get("DATABASE_URL_SYNC", "")
        url = url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if not url:
        print("no db url"); sys.exit(1)
    return url


async def main() -> None:
    engine = create_async_engine(_async_url())
    SessionMaker = async_sessionmaker(engine, expire_on_commit=False)

    async with SessionMaker() as db:
        # Use the seeded learner1 user.
        learner_user = (
            await db.execute(select(User).where(User.username == "learner1"))
        ).scalar_one_or_none()
        if not learner_user:
            raise SystemExit("Seeded learner 'learner1' not found.")

        print(f"Using learner user_id={learner_user.id}")

        # 1) Quest list scoped per-language.
        prog = LearnerProgressService(db)
        quests = await prog.list_quests_for_user(learner_user.id)

        by_lang: dict[str, dict[str, int]] = {}
        for q in quests:
            lang = (q.language or "python").lower()
            by_lang.setdefault(lang, {"completed": 0, "current": 0, "locked": 0})
            by_lang[lang][q.status] = by_lang[lang].get(q.status, 0) + 1

        print("\nQuest counts per language (completed / current / locked):")
        for lang in sorted(by_lang):
            stats = by_lang[lang]
            print(
                f"  {lang}: completed={stats.get('completed', 0)} "
                f"current={stats.get('current', 0)} "
                f"locked={stats.get('locked', 0)}"
            )

        # Each language with at least one quest must have exactly 0 or 1
        # "current" quest. Crucially, java/cpp must NOT be all-locked just
        # because python isn't finished.
        for lang in ("java", "cpp"):
            if lang not in by_lang:
                continue
            current = by_lang[lang].get("current", 0)
            locked = by_lang[lang].get("locked", 0)
            assert current <= 1, f"{lang} has more than one current quest"
            assert current >= 1 or by_lang[lang].get("completed", 0) >= 1, (
                f"{lang} has no current quest unlocked. Per-language progression broken: "
                f"current={current} locked={locked}"
            )
        print("OK quest progression scoped per language.")

        # 2) Path list returns language and unlocks per-language.
        paths_svc = LearningPathService(db)
        path_summaries = await paths_svc.list_paths(current_user=learner_user)
        print("\nLearning paths:")
        for ps in path_summaries:
            print(
                f"  level={ps.level} lang={ps.language} unlocked={ps.unlocked} "
                f"completed={ps.completed_count}/{ps.quest_count} title={ps.title!r}"
            )
        java_paths = [p for p in path_summaries if p.language == "java"]
        cpp_paths = [p for p in path_summaries if p.language == "cpp"]
        assert java_paths, "Expected at least one Java path"
        assert cpp_paths, "Expected at least one C++ path"
        # Level-1 paths are always unlocked.
        assert all(p.unlocked for p in java_paths if p.level == 1), (
            "Java level 1 path should be unlocked"
        )
        assert all(p.unlocked for p in cpp_paths if p.level == 1), (
            "C++ level 1 path should be unlocked"
        )
        print("OK per-language paths unlocked at level 1.")

        # 3) Path detail returns language + correct unlock state.
        java_path_id: UUID = UUID(java_paths[0].id)
        java_path_row = (
            await db.execute(select(LearningPath).where(LearningPath.id == java_path_id))
        ).scalar_one()
        assert java_path_row.language == "java"

        detail = await paths_svc.get_path_detail(
            path_id=str(java_path_id), user_id=learner_user.id
        )
        assert detail.language == "java"
        assert detail.is_unlocked is True
        assert detail.quests, "Java path has no quests"
        assert detail.quests[0].status in {"completed", "current"}, (
            f"First Java quest should be unlocked, got status={detail.quests[0].status!r}"
        )
        print(
            f"OK Java path detail: language={detail.language} "
            f"first_quest_status={detail.quests[0].status} quests={len(detail.quests)}"
        )

    print("\nPhase 5 smoke: PASSED")


if __name__ == "__main__":
    asyncio.run(main())
