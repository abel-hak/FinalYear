"""
Seed script: creates one Learner, one Admin, and three sample Quests with TestCases.
Uses passlib (bcrypt) for password hashing so seeded users work with auth in M3+.

Run from backend dir: python -m scripts.seed
Requires: DATABASE_URL_SYNC or DATABASE_URL set (sync URL used for script).
"""
import os
import sys
import uuid

# Add backend root to path so "app" is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env if present
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

# Use sync URL
database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
if not database_url or database_url == "postgresql+psycopg://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env (e.g. postgresql+psycopg://user:pass@localhost:5432/codequest)")
    sys.exit(1)

from app.db.base import Base
from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.learning_path import LearningPath, LearningPathQuest

# Real password hashing so M3 login works with seeded users (use bcrypt directly, same as app)
def _hash_password(password: str) -> str:
    import bcrypt
    pw = password.encode("utf-8")
    if len(pw) > 72:
        pw = pw[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)

def seed():
    session = Session()
    try:
        # Check if already seeded (use Quest, not User – a manually registered
        # user should not prevent the seed from populating quests)
        if session.query(Quest).first():
            print("Data already present; skip seeding.")
            return

        # 1) Learner user
        learner_user = User(
            id=uuid.uuid4(),
            username="learner1",
            email="learner@codequest.dev",
            password_hash=_hash_password("learner123"),
            role="learner",
        )
        session.add(learner_user)
        session.flush()
        learner = Learner(
            id=uuid.uuid4(),
            user_id=learner_user.id,
            current_level=1,
            total_points=0,
        )
        session.add(learner)

        # 2) Admin user
        admin_user = User(
            id=uuid.uuid4(),
            username="admin1",
            email="admin@codequest.dev",
            password_hash=_hash_password("admin123"),
            role="admin",
        )
        session.add(admin_user)
        session.flush()
        admin = Admin(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            admin_status="active",
        )
        session.add(admin)

        # 3) Quest 1: Fix a variable
        q1 = Quest(
            id=uuid.uuid4(),
            title="Fix the variable",
            description="The code should print 10. Fix the bug in the variable.",
            level=1,
            order_rank=1,
            initial_code='x = 5\nprint(x + 3)  # should print 10',
            solution_code='x = 7\nprint(x + 3)  # prints 10',
            explanation="You needed to set x = 7 so that x + 3 equals 10.",
            tags=["variables", "arithmetic"],
        )
        session.add(q1)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q1.id,
            input_data=None,
            expected_output="10\n",
            is_hidden=False,
        ))

        # 4) Quest 2: Fix a loop
        q2 = Quest(
            id=uuid.uuid4(),
            title="Fix the loop",
            description="The code should print numbers 1 to 3, one per line.",
            level=1,
            order_rank=2,
            initial_code='for i in range(3):\n    print(i)',
            solution_code='for i in range(1, 4):\n    print(i)',
            explanation="range(1, 4) gives 1, 2, 3. range(3) gives 0, 1, 2.",
        )
        session.add(q2)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q2.id,
            input_data=None,
            expected_output="1\n2\n3\n",
            is_hidden=False,
        ))

        # 5) Quest 3: Fix a condition
        q3 = Quest(
            id=uuid.uuid4(),
            title="Fix the condition",
            description="The code should print 'even' when n is 4. Fix the condition.",
            level=1,
            order_rank=3,
            initial_code='n = 4\nif n % 2 == 1:\n    print("even")\nelse:\n    print("odd")',
            solution_code='n = 4\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
            explanation="n % 2 == 0 is True for even numbers. Use == 0 for 'even', not == 1.",
            tags=["conditions", "modulo"],
        )
        session.add(q3)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q3.id,
            input_data=None,
            expected_output="even\n",
            is_hidden=False,
        ))

        # 6) Quest 4: Fix a function (Level 2)
        q4 = Quest(
            id=uuid.uuid4(),
            title="Fix the function",
            description="The function should return the sum of a and b. Fix the bug.",
            level=2,
            order_rank=4,
            initial_code='def add(a, b):\n    return a - b  # wrong operator\nprint(add(2, 3))',
            solution_code='def add(a, b):\n    return a + b\nprint(add(2, 3))',
            explanation="Use + for addition, not -.",
            tags=["functions", "return"],
        )
        session.add(q4)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q4.id,
            input_data=None,
            expected_output="5\n",
            is_hidden=False,
        ))

        # 7) Quest 5: Fix a list (Level 2)
        q5 = Quest(
            id=uuid.uuid4(),
            title="Fix the list",
            description="The code should print [1, 2, 3]. Fix the bug.",
            level=2,
            order_rank=5,
            initial_code='nums = [1, 2]\nnums.append(4)\nprint(nums)',
            solution_code='nums = [1, 2]\nnums.append(3)\nprint(nums)',
            explanation="Append 3 to get [1, 2, 3], not 4.",
            tags=["lists", "append"],
        )
        session.add(q5)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q5.id,
            input_data=None,
            expected_output="[1, 2, 3]\n",
            is_hidden=False,
        ))

        # 8) Quest 6: Fix a string (Level 2)
        q6 = Quest(
            id=uuid.uuid4(),
            title="Fix the string",
            description="The code should print 'hello world'. Fix the string concatenation.",
            level=2,
            order_rank=6,
            initial_code='a = "hello"\nb = "world"\nprint(a + b)  # missing space',
            solution_code='a = "hello "\nb = "world"\nprint(a + b)',
            explanation="Add a space after 'hello' so the output is 'hello world'.",
            tags=["strings", "concatenation"],
        )
        session.add(q6)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q6.id,
            input_data=None,
            expected_output="hello world\n",
            is_hidden=False,
        ))

        # 9) Quest 7: Fix a dict (Level 2)
        q7 = Quest(
            id=uuid.uuid4(),
            title="Fix the dictionary",
            description="The code should print 42. Fix the dictionary lookup.",
            level=2,
            order_rank=7,
            initial_code='d = {"x": 42, "y": 10}\nprint(d["z"])  # wrong key',
            solution_code='d = {"x": 42, "y": 10}\nprint(d["x"])',
            explanation="Use key 'x' to get 42, not 'z'.",
            tags=["dict", "lookup"],
        )
        session.add(q7)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q7.id,
            input_data=None,
            expected_output="42\n",
            is_hidden=False,
        ))

        # 10) Quest 8: Fix exception handling (Level 3)
        q8 = Quest(
            id=uuid.uuid4(),
            title="Fix the exception",
            description="The code should print 'OK' when dividing 10 by 2. Fix the try/except.",
            level=3,
            order_rank=8,
            initial_code='try:\n    x = 10 / 0\n    print("OK")\nexcept:\n    print("Error")',
            solution_code='try:\n    x = 10 / 2\n    print("OK")\nexcept:\n    print("Error")',
            explanation="Use 10 / 2 so no exception is raised.",
            tags=["exceptions", "division"],
        )
        session.add(q8)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q8.id,
            input_data=None,
            expected_output="OK\n",
            is_hidden=False,
        ))

        # 11) Quest 9: Fix ValueError (Level 3)
        q9 = Quest(
            id=uuid.uuid4(),
            title="Fix the conversion",
            description="The code should print 100. Fix the int() conversion.",
            level=3,
            order_rank=9,
            initial_code='s = "100"\nprint(int(s) + 1)  # should be 100',
            solution_code='s = "100"\nprint(int(s))',
            explanation="Remove the +1 to get 100.",
            tags=["type conversion", "int"],
        )
        session.add(q9)
        session.flush()
        session.add(TestCase(
            id=uuid.uuid4(),
            quest_id=q9.id,
            input_data=None,
            expected_output="100\n",
            is_hidden=False,
        ))

        # 12) Learning paths: Level 1, 2, 3
        path1 = LearningPath(
            id=uuid.uuid4(),
            title="Python Basics",
            description="Master variables, loops, and conditions through debugging challenges.",
            level=1,
            order_rank=1,
        )
        session.add(path1)
        session.flush()
        for i, q in enumerate([q1, q2, q3], start=1):
            session.add(LearningPathQuest(
                id=uuid.uuid4(),
                path_id=path1.id,
                quest_id=q.id,
                order_rank=i,
            ))

        path2 = LearningPath(
            id=uuid.uuid4(),
            title="Intermediate Python",
            description="Functions, lists, and more debugging practice.",
            level=2,
            order_rank=2,
        )
        session.add(path2)
        session.flush()
        for i, q in enumerate([q4, q5, q6, q7], start=1):
            session.add(LearningPathQuest(
                id=uuid.uuid4(),
                path_id=path2.id,
                quest_id=q.id,
                order_rank=i,
            ))

        path3 = LearningPath(
            id=uuid.uuid4(),
            title="Advanced",
            description="Exception handling and advanced debugging.",
            level=3,
            order_rank=3,
        )
        session.add(path3)
        session.flush()
        for i, q in enumerate([q8, q9], start=1):
            session.add(LearningPathQuest(
                id=uuid.uuid4(),
                path_id=path3.id,
                quest_id=q.id,
                order_rank=i,
            ))

        session.commit()
        print("Seeded: 1 learner, 1 admin, 9 quests with test cases, 3 level-by-level learning paths.")
        print("  Learner: learner@codequest.dev / learner123")
        print("  Admin:   admin@codequest.dev / admin123")
    except Exception as e:
        session.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
