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
    "postgresql+asyncpg://", "postgresql://", 1
)
if not database_url or database_url == "postgresql://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env (e.g. postgresql://user:pass@localhost:5432/codequest)")
    sys.exit(1)

from app.db.base import Base
from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin
from app.models.quest import Quest
from app.models.test_case import TestCase

# Real password hashing so M3 login works with seeded users
def _hash_password(password: str) -> str:
    from passlib.context import CryptContext
    return CryptContext(schemes=["bcrypt"], deprecated="auto").hash(password)

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)

def seed():
    session = Session()
    try:
        # Check if already seeded
        if session.query(User).first():
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

        session.commit()
        print("Seeded: 1 learner, 1 admin, 3 quests with test cases.")
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
