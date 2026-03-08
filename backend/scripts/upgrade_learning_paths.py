"""
Upgrade existing DB to level-by-level learning paths.
Run after migration 007 if you have the old single-path structure.

- Updates existing path to level=1
- Adds quests 4, 5, 6 if missing
- Creates Level 2 and Level 3 paths

python -m scripts.upgrade_learning_paths
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


def main():
    session = Session()
    try:
        # 1) Add quests 4, 5, 6 if we have fewer than 6
        quest_count = session.query(Quest).filter(Quest.is_deleted.is_(False)).count()
        if quest_count < 6:
            max_rank = session.query(Quest).filter(Quest.is_deleted.is_(False)).order_by(Quest.order_rank.desc()).first()
            next_rank = (max_rank.order_rank + 1) if max_rank else 4

            # Quest 4
            q4 = Quest(
                id=uuid.uuid4(),
                title="Fix the function",
                description="The function should return the sum of a and b. Fix the bug.",
                level=2,
                order_rank=next_rank,
                initial_code='def add(a, b):\n    return a - b  # wrong operator\nprint(add(2, 3))',
                solution_code='def add(a, b):\n    return a + b\nprint(add(2, 3))',
                explanation="Use + for addition, not -.",
                tags=["functions", "return"],
            )
            session.add(q4)
            session.flush()
            from app.models.test_case import TestCase
            session.add(TestCase(id=uuid.uuid4(), quest_id=q4.id, input_data=None, expected_output="5\n", is_hidden=False))

            # Quest 5
            q5 = Quest(
                id=uuid.uuid4(),
                title="Fix the list",
                description="The code should print [1, 2, 3]. Fix the bug.",
                level=2,
                order_rank=next_rank + 1,
                initial_code='nums = [1, 2]\nnums.append(4)\nprint(nums)',
                solution_code='nums = [1, 2]\nnums.append(3)\nprint(nums)',
                explanation="Append 3 to get [1, 2, 3], not 4.",
                tags=["lists", "append"],
            )
            session.add(q5)
            session.flush()
            session.add(TestCase(id=uuid.uuid4(), quest_id=q5.id, input_data=None, expected_output="[1, 2, 3]\n", is_hidden=False))

            # Quest 6
            q6 = Quest(
                id=uuid.uuid4(),
                title="Fix the exception",
                description="The code should print 'OK' when dividing 10 by 2. Fix the try/except.",
                level=3,
                order_rank=next_rank + 2,
                initial_code='try:\n    x = 10 / 0\n    print("OK")\nexcept:\n    print("Error")',
                solution_code='try:\n    x = 10 / 2\n    print("OK")\nexcept:\n    print("Error")',
                explanation="Use 10 / 2 so no exception is raised.",
                tags=["exceptions", "division"],
            )
            session.add(q6)
            session.flush()
            session.add(TestCase(id=uuid.uuid4(), quest_id=q6.id, input_data=None, expected_output="OK\n", is_hidden=False))
            print("Added quests 4, 5, 6.")

        # 2) Update existing paths to have level, create Level 2 and 3 if needed
        paths = session.query(LearningPath).all()
        level_2_exists = any(p.level == 2 for p in paths)
        level_3_exists = any(p.level == 3 for p in paths)

        for p in paths:
            if p.level == 1:
                p.title = "Python Basics"
                p.description = "Master variables, loops, and conditions through debugging challenges."

        if not level_2_exists or not level_3_exists:
            all_quests = session.query(Quest).filter(Quest.is_deleted.is_(False)).order_by(Quest.order_rank).all()
            by_level = {}
            for q in all_quests:
                by_level.setdefault(q.level, []).append(q)

            if not level_2_exists and by_level.get(2):
                path2 = LearningPath(
                    id=uuid.uuid4(),
                    title="Intermediate Python",
                    description="Functions, lists, and more debugging practice.",
                    level=2,
                    order_rank=2,
                )
                session.add(path2)
                session.flush()
                for i, q in enumerate(by_level[2], start=1):
                    session.add(LearningPathQuest(id=uuid.uuid4(), path_id=path2.id, quest_id=q.id, order_rank=i))
                print("Created Level 2 path.")

            if not level_3_exists and by_level.get(3):
                path3 = LearningPath(
                    id=uuid.uuid4(),
                    title="Advanced",
                    description="Exception handling and advanced debugging.",
                    level=3,
                    order_rank=3,
                )
                session.add(path3)
                session.flush()
                for i, q in enumerate(by_level[3], start=1):
                    session.add(LearningPathQuest(id=uuid.uuid4(), path_id=path3.id, quest_id=q.id, order_rank=i))
                print("Created Level 3 path.")

        session.commit()
        print("Upgrade complete.")
    except Exception as e:
        session.rollback()
        print(f"Failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
