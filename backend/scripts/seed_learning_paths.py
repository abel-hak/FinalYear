"""
Add level-by-level learning paths if none exist. Run after migrations on existing DBs.
python -m scripts.seed_learning_paths
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pathlib import Path
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql://", 1
)
if not database_url or database_url == "postgresql://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env")
    sys.exit(1)

from app.models.quest import Quest
from app.models.learning_path import LearningPath, LearningPathQuest

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)

LEVEL_CONFIG = [
    (1, "Python Basics", "Master variables, loops, and conditions through debugging challenges."),
    (2, "Intermediate Python", "Functions, lists, and more debugging practice."),
    (3, "Advanced", "Exception handling and advanced debugging."),
]


def main():
    session = Session()
    try:
        if session.query(LearningPath).first():
            print("Learning paths already exist; skip.")
            return

        all_quests = session.query(Quest).filter(Quest.is_deleted.is_(False)).order_by(Quest.order_rank).all()
        if not all_quests:
            print("No quests found. Run seed first.")
            return

        # Group quests by level
        by_level = {}
        for q in all_quests:
            by_level.setdefault(q.level, []).append(q)

        created = 0
        for order_rank, (level, title, desc) in enumerate(LEVEL_CONFIG, start=1):
            quests = by_level.get(level, [])
            if not quests:
                continue
            path = LearningPath(
                id=uuid.uuid4(),
                title=title,
                description=desc,
                level=level,
                order_rank=order_rank,
            )
            session.add(path)
            session.flush()
            for i, q in enumerate(quests, start=1):
                session.add(LearningPathQuest(
                    id=uuid.uuid4(),
                    path_id=path.id,
                    quest_id=q.id,
                    order_rank=i,
                ))
            created += 1
            print(f"Created '{title}' with {len(quests)} quests.")

        session.commit()
        print(f"Done. Created {created} learning path(s).")
    except Exception as e:
        session.rollback()
        print(f"Failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
