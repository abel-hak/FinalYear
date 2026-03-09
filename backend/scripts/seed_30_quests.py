"""
Seed script: creates one Learner, one Admin, 30 Quests with TestCases, and 3 level-by-level Learning Paths.

Usage (from backend directory):
    python -m scripts.seed_30_quests

Notes:
- Uses the same DATABASE_URL* envs as scripts.seed.
- If any users already exist, seeding is skipped (use scripts.reset_and_seed_30 for a fresh reseed).
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
    with open(env_path, encoding="utf-8") as f:
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

from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin
from app.models.quest import Quest
from app.models.test_case import TestCase
from app.models.learning_path import LearningPath, LearningPathQuest


def _hash_password(password: str) -> str:
    import bcrypt

    pw = password.encode("utf-8")
    if len(pw) > 72:
        pw = pw[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


QUESTS = [
    # -------------------------
    # Level 1 (Basics) — 10
    # -------------------------
    dict(
        level=1,
        order_rank=1,
        title="Fix the variable",
        description="The code should print 10. Fix the bug in the variable.",
        tags=["variables", "arithmetic"],
        initial_code='x = 5\\nprint(x + 3)  # should print 10',
        solution_code='x = 7\\nprint(x + 3)  # prints 10',
        expected_output="10\n",
        explanation="Set x = 7 so that x + 3 equals 10.",
    ),
    dict(
        level=1,
        order_rank=2,
        title="Fix the arithmetic",
        description="The code should print 10. Fix the calculation.",
        tags=["arithmetic"],
        initial_code='x = 5\\nprint(x + 4)  # should print 10',
        solution_code='x = 6\\nprint(x + 4)',
        expected_output="10\n",
        explanation="Set x so that x + 4 equals 10.",
    ),
    dict(
        level=1,
        order_rank=3,
        title="Fix the string spacing",
        description="The code should print 'hello world'. Fix the concatenation.",
        tags=["strings", "concatenation"],
        initial_code='a = "hello"\\nb = "world"\\nprint(a + b)  # should print hello world',
        solution_code='a = "hello "\\nb = "world"\\nprint(a + b)',
        expected_output="hello world\n",
        explanation="Add a space so the words don’t join together.",
    ),
    dict(
        level=1,
        order_rank=4,
        title="Fix the slice",
        description="The code should print 'ell'. Fix the slice end index.",
        tags=["strings"],
        initial_code='s = "hello"\\nprint(s[1:3])  # should print ell',
        solution_code='s = "hello"\\nprint(s[1:4])',
        expected_output="ell\n",
        explanation="Slices are end-exclusive, so you need 1:4 to include index 3.",
    ),
    dict(
        level=1,
        order_rank=5,
        title="Fix the boundary condition",
        description="The code should print 'adult' when age is 18.",
        tags=["conditions"],
        initial_code='age = 18\\nif age > 18:\\n    print("adult")\\nelse:\\n    print("minor")',
        solution_code='age = 18\\nif age >= 18:\\n    print("adult")\\nelse:\\n    print("minor")',
        expected_output="adult\n",
        explanation="Use >= so 18 counts as adult.",
    ),
    dict(
        level=1,
        order_rank=6,
        title="Fix the even/odd check",
        description="The code should print 'even' for n=4. Fix the modulo logic.",
        tags=["conditions", "modulo"],
        initial_code='n = 4\\nif n % 2 == 1:\\n    print("even")\\nelse:\\n    print("odd")',
        solution_code='n = 4\\nif n % 2 == 0:\\n    print("even")\\nelse:\\n    print("odd")',
        expected_output="even\n",
        explanation="Even numbers have remainder 0 when divided by 2.",
    ),
    dict(
        level=1,
        order_rank=7,
        title="Fix the range",
        description="The code should print 1 to 3 (one per line).",
        tags=["loops", "range"],
        initial_code="for i in range(3):\n    print(i)",
        solution_code="for i in range(1, 4):\n    print(i)",
        expected_output="1\n2\n3\n",
        explanation="range(1, 4) yields 1, 2, 3.",
    ),
    dict(
        level=1,
        order_rank=8,
        title="Fix the while loop",
        description="The code should print 3, 2, 1 (one per line). Fix the infinite loop.",
        tags=["loops"],
        initial_code="n = 3\nwhile n > 0:\n    print(n)\n    n += 1  # should count down",
        solution_code="n = 3\nwhile n > 0:\n    print(n)\n    n -= 1",
        expected_output="3\n2\n1\n",
        explanation="To end the loop, the counter must move toward the condition becoming false.",
    ),
    dict(
        level=1,
        order_rank=9,
        title="Fix the return value",
        description="The function should return the sum. Fix the operator.",
        tags=["functions", "return"],
        initial_code="def add(a, b):\n    return a - b\n\nprint(add(2, 3))  # should print 5",
        solution_code="def add(a, b):\n    return a + b\n\nprint(add(2, 3))",
        expected_output="5\n",
        explanation="Use + to add values.",
    ),
    dict(
        level=1,
        order_rank=10,
        title="Fix the conversion",
        description="The code should print 100. Fix the int() conversion logic.",
        tags=["type conversion", "int"],
        initial_code='s = "100"\\nprint(int(s) + 1)  # should be 100',
        solution_code='s = "100"\\nprint(int(s))',
        expected_output="100\n",
        explanation="Remove the extra +1 so the output is exactly 100.",
    ),
    # -------------------------
    # Level 2 (Core structures) — 12
    # -------------------------
    dict(
        level=2,
        order_rank=11,
        title="Fix append vs extend",
        description="The code should print [1, 2, 3]. Fix how the list is updated.",
        tags=["lists", "append"],
        initial_code="nums = [1]\nnums.append([2, 3])\nprint(nums)  # should print [1, 2, 3]",
        solution_code="nums = [1]\nnums.extend([2, 3])\nprint(nums)",
        expected_output="[1, 2, 3]\n",
        explanation="append adds one item (a nested list). extend adds each element.",
    ),
    dict(
        level=2,
        order_rank=12,
        title="Fix list aliasing",
        description="The code should keep nums as [1, 2, 3]. Fix the copy bug.",
        tags=["lists"],
        initial_code="nums = [1, 2, 3]\nbackup = nums\nbackup.append(4)\nprint(nums)  # should print [1, 2, 3]",
        solution_code="nums = [1, 2, 3]\nbackup = nums.copy()\nbackup.append(4)\nprint(nums)",
        expected_output="[1, 2, 3]\n",
        explanation="backup = nums points to the same list; copy() creates a separate list.",
    ),
    dict(
        level=2,
        order_rank=13,
        title="Fix sort() usage",
        description="The code should print [1, 2, 3]. Fix the None output.",
        tags=["lists"],
        initial_code="nums = [3, 1, 2]\nsorted_nums = nums.sort()\nprint(sorted_nums)  # should print [1, 2, 3]",
        solution_code="nums = [3, 1, 2]\nnums.sort()\nprint(nums)",
        expected_output="[1, 2, 3]\n",
        explanation="list.sort() sorts in-place and returns None.",
    ),
    dict(
        level=2,
        order_rank=14,
        title="Fix the dictionary key",
        description="The code should print 42. Fix the wrong key lookup.",
        tags=["dict", "lookup"],
        initial_code='d = {"x": 42, "y": 10}\nprint(d["z"])  # should print 42',
        solution_code='d = {"x": 42, "y": 10}\nprint(d["x"])',
        expected_output="42\n",
        explanation="Use an existing key.",
    ),
    dict(
        level=2,
        order_rank=15,
        title="Fix default dict lookup",
        description="The code should print 1. Fix the NoneType error.",
        tags=["dict", "lookup"],
        initial_code='d = {"x": 1}\nprint(d.get("y") + 1)  # should print 1',
        solution_code='d = {"x": 1}\nprint(d.get("y", 0) + 1)',
        expected_output="1\n",
        explanation="Provide a default value when the key is missing.",
    ),
    dict(
        level=2,
        order_rank=16,
        title="Fix mutable default argument",
        description="The second call should print [2], not [1, 2].",
        tags=["functions"],
        initial_code="def add_item(item, items=[]):\n    items.append(item)\n    return items\n\nprint(add_item(1))\nprint(add_item(2))  # should print [2]",
        solution_code="def add_item(item, items=None):\n    if items is None:\n        items = []\n    items.append(item)\n    return items\n\nprint(add_item(1))\nprint(add_item(2))",
        expected_output="[1]\n[2]\n",
        explanation="Default list values persist across calls; use None and create a new list.",
    ),
    dict(
        level=2,
        order_rank=17,
        title="Fix missing return",
        description="The code should print 6. Fix the function to return a value.",
        tags=["return", "functions"],
        initial_code="def double(n):\n    n * 2\n\nprint(double(3))  # should print 6",
        solution_code="def double(n):\n    return n * 2\n\nprint(double(3))",
        expected_output="6\n",
        explanation="Without return, Python returns None.",
    ),
    dict(
        level=2,
        order_rank=18,
        title="Fix string join",
        description="The code should print 'a-b-c'. Fix the join usage.",
        tags=["strings"],
        initial_code='parts = ["a", "b", "c"]\nprint(parts.join("-"))  # should print a-b-c',
        solution_code='parts = ["a", "b", "c"]\nprint("-".join(parts))',
        expected_output="a-b-c\n",
        explanation="join is a string method: separator.join(list).",
    ),
    dict(
        level=2,
        order_rank=19,
        title="Fix off-by-one sum",
        description="The code should print 15 (1+2+3+4+5). Fix the range.",
        tags=["loops", "range"],
        initial_code="total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)  # should print 15",
        solution_code="total = 0\nfor i in range(1, 6):\n    total += i\nprint(total)",
        expected_output="15\n",
        explanation="range end is exclusive; use 6 to include 5.",
    ),
    dict(
        level=2,
        order_rank=20,
        title="Fix dictionary update",
        description="The code should print 2. Fix how the dict is updated.",
        tags=["dict"],
        initial_code='d = {"x": 1}\nd.update("y", 2)\nprint(d["y"])  # should print 2',
        solution_code='d = {"x": 1}\nd.update({"y": 2})\nprint(d["y"])',
        expected_output="2\n",
        explanation="dict.update expects a mapping or iterable of key/value pairs.",
    ),
    dict(
        level=2,
        order_rank=21,
        title="Fix list indexing",
        description="The code should print 3. Fix the IndexError.",
        tags=["lists"],
        initial_code="nums = [1, 2, 3]\nprint(nums[3])  # should print 3",
        solution_code="nums = [1, 2, 3]\nprint(nums[2])",
        expected_output="3\n",
        explanation="Lists are 0-indexed; the last element is at index 2.",
    ),
    dict(
        level=2,
        order_rank=22,
        title="Fix the parentheses",
        description="The code should print 16. Fix the math grouping.",
        tags=["arithmetic"],
        initial_code="x = 2\nprint((x + 2) * 7)  # should print 16",
        solution_code="x = 2\nprint(x + 2 * 7)",
        expected_output="16\n",
        explanation="Operator precedence matters; remove the incorrect parentheses to match the intended result.",
    ),
    # -------------------------
    # Level 3 (Debugging & exceptions) — 8
    # -------------------------
    dict(
        level=3,
        order_rank=23,
        title="Fix the exception type",
        description="The code should print OK. Catch the correct exception.",
        tags=["exceptions", "type conversion"],
        initial_code='try:\n    int("x")\n    print("OK")\nexcept TypeError:\n    print("OK")\nexcept Exception:\n    print("Error")',
        solution_code='try:\n    int("x")\n    print("OK")\nexcept ValueError:\n    print("OK")',
        expected_output="OK\n",
        explanation="int('x') raises ValueError, not TypeError.",
    ),
    dict(
        level=3,
        order_rank=24,
        title="Fix duplicate output",
        description="The code should print OK only once. Remove the extra print.",
        tags=["exceptions", "error handling"],
        initial_code='try:\n    x = 10 / 2\n    print("OK")\nexcept Exception:\n    print("Error")\nprint("OK")  # should print OK only once',
        solution_code='try:\n    x = 10 / 2\n    print("OK")\nexcept Exception:\n    print("Error")',
        expected_output="OK\n",
        explanation="The extra print caused the output to appear twice.",
    ),
    dict(
        level=3,
        order_rank=25,
        title="Fix the division",
        description="The code should print 5. Fix the ZeroDivisionError.",
        tags=["exceptions", "division"],
        initial_code="a = 10\nb = 0\nprint(a // b)  # should print 5",
        solution_code="a = 10\nb = 2\nprint(a // b)",
        expected_output="5\n",
        explanation="Division by zero raises an exception; use a valid divisor.",
    ),
    dict(
        level=3,
        order_rank=26,
        title="Fix the validation",
        description="The code should print OK. Fix the wrong raise condition.",
        tags=["exceptions", "best practices"],
        initial_code='age = 20\nif age >= 0:\n    raise ValueError("Invalid age")\nprint("OK")',
        solution_code='age = 20\nif age < 0:\n    raise ValueError("Invalid age")\nprint("OK")',
        expected_output="OK\n",
        explanation="Raise an error only when the value is actually invalid.",
    ),
    dict(
        level=3,
        order_rank=27,
        title="Fix the KeyError safely",
        description="The code should print 0. Handle missing dictionary keys safely.",
        tags=["dict", "exceptions"],
        initial_code='scores = {"alice": 3}\nprint(scores["bob"])  # should print 0',
        solution_code='scores = {"alice": 3}\nprint(scores.get("bob", 0))',
        expected_output="0\n",
        explanation="Use dict.get() with a default for missing keys.",
    ),
    dict(
        level=3,
        order_rank=28,
        title="Fix nonlocal scope",
        description="The code should print 1. Fix the scope bug.",
        tags=["functions"],
        initial_code="def counter():\n    x = 0\n    def inc():\n        x += 1\n        return x\n    return inc()\n\nprint(counter())",
        solution_code="def counter():\n    x = 0\n    def inc():\n        nonlocal x\n        x += 1\n        return x\n    return inc()\n\nprint(counter())",
        expected_output="1\n",
        explanation="Assigning to an outer variable inside a nested function requires nonlocal.",
    ),
    dict(
        level=3,
        order_rank=29,
        title="Fix comprehension filter",
        description="The code should print [2, 4]. Fix the condition.",
        tags=["loops", "modulo"],
        initial_code="nums = [1, 2, 3, 4]\nevans = [n for n in nums if n % 2 == 1]\nprint(evans)  # should print [2, 4]",
        solution_code="nums = [1, 2, 3, 4]\nevans = [n for n in nums if n % 2 == 0]\nprint(evans)",
        expected_output="[2, 4]\n",
        explanation="Even numbers have remainder 0 modulo 2.",
    ),
    dict(
        level=3,
        order_rank=30,
        title="Remove noisy debug output",
        description="The code should print only DONE. Remove the debug print.",
        tags=["debugging", "best practices"],
        initial_code='print("DEBUG: starting")  # should not be printed\nprint("DONE")',
        solution_code='print("DONE")',
        expected_output="DONE\n",
        explanation="Remove debug output so tests match exactly.",
    ),
]


def seed() -> None:
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        if session.query(User).first():
            print("Data already present; skip seeding. (Use scripts.reset_and_seed_30 for a fresh reseed.)")
            return

        learner_user = User(
            id=uuid.uuid4(),
            username="learner1",
            email="learner@codequest.dev",
            password_hash=_hash_password("learner123"),
            role="learner",
        )
        session.add(learner_user)
        session.flush()
        session.add(
            Learner(
                id=uuid.uuid4(),
                user_id=learner_user.id,
                current_level=1,
                total_points=0,
            )
        )

        admin_user = User(
            id=uuid.uuid4(),
            username="admin1",
            email="admin@codequest.dev",
            password_hash=_hash_password("admin123"),
            role="admin",
        )
        session.add(admin_user)
        session.flush()
        session.add(Admin(id=uuid.uuid4(), user_id=admin_user.id, admin_status="active"))

        # Quests + test cases
        created_quests: list[Quest] = []
        for q in QUESTS:
            quest = Quest(
                id=uuid.uuid4(),
                title=q["title"],
                description=q["description"],
                level=q["level"],
                order_rank=q["order_rank"],
                initial_code=q["initial_code"],
                solution_code=q["solution_code"],
                explanation=q["explanation"],
                tags=q["tags"],
            )
            session.add(quest)
            session.flush()
            session.add(
                TestCase(
                    id=uuid.uuid4(),
                    quest_id=quest.id,
                    input_data=None,
                    expected_output=q["expected_output"],
                    is_hidden=False,
                )
            )
            created_quests.append(quest)

        # Learning paths by level
        paths = [
            dict(
                level=1,
                order_rank=1,
                title="Python Basics",
                description="Core syntax and control flow through debugging challenges.",
            ),
            dict(
                level=2,
                order_rank=2,
                title="Core Python Data Structures",
                description="Lists, dictionaries, and functions through practical debugging.",
            ),
            dict(
                level=3,
                order_rank=3,
                title="Debugging & Exceptions",
                description="Error handling, debugging discipline, and tricky Python gotchas.",
            ),
        ]

        by_level: dict[int, list[Quest]] = {1: [], 2: [], 3: []}
        for quest in created_quests:
            by_level.setdefault(int(quest.level), []).append(quest)

        for cfg in paths:
            quests = sorted(by_level.get(cfg["level"], []), key=lambda x: x.order_rank)
            if not quests:
                continue
            path = LearningPath(
                id=uuid.uuid4(),
                title=cfg["title"],
                description=cfg["description"],
                level=cfg["level"],
                order_rank=cfg["order_rank"],
            )
            session.add(path)
            session.flush()
            for i, quest in enumerate(quests, start=1):
                session.add(
                    LearningPathQuest(
                        id=uuid.uuid4(),
                        path_id=path.id,
                        quest_id=quest.id,
                        order_rank=i,
                    )
                )

        session.commit()
        print("Seeded: 1 learner, 1 admin, 30 quests with test cases, 3 learning paths.")
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

