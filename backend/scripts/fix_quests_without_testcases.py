"""
Fix script to ensure all quests have at least one test case.

This script identifies quests without test cases and adds a default test case.
Run from backend dir: python -m scripts.fix_quests_without_testcases
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

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
if not database_url or database_url == "postgresql+psycopg://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env")
    sys.exit(1)

from app.models.quest import Quest
from app.models.test_case import TestCase

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)

def fix_quests_without_testcases():
    session = Session()
    try:
        print("Checking for quests without test cases...\n")

        # Get all active quests
        all_quests = session.query(Quest).filter(Quest.is_deleted.is_(False)).all()
        print(f"Total active quests: {len(all_quests)}\n")

        # Find quests without test cases
        quests_without_tests = []
        for quest in all_quests:
            test_cases = session.query(TestCase).filter(
                TestCase.quest_id == quest.id,
                TestCase.is_deleted.is_(False)
            ).all()
            
            if not test_cases:
                quests_without_tests.append(quest)
                print(f"⚠ Quest '{quest.title}' (ID: {quest.id}) has no test cases")

        if not quests_without_tests:
            print("✓ All quests have test cases!")
            return

        print(f"\nFound {len(quests_without_tests)} quest(s) without test cases.")
        print("Adding default test case...\n")

        # Add default test case for each quest
        for quest in quests_without_tests:
            default_test = TestCase(
                id=uuid.uuid4(),
                quest_id=quest.id,
                input_data={},
                expected_output="OK\n",
                is_hidden=False,
            )
            session.add(default_test)
            print(f"✓ Added default test case to '{quest.title}'")

        session.commit()
        print(f"\n✓ Fixed {len(quests_without_tests)} quest(s)")

    except Exception as e:
        session.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    fix_quests_without_testcases()
