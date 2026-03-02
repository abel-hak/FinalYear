"""
Reset and reseed the CodeQuest database.

Usage (from backend directory):

    python -m scripts.reset_and_seed

This will:
- TRUNCATE submissions, test_cases, quests, learners, admins, users
- RESTART IDENTITY CASCADE
- Call scripts.seed.seed() to insert demo users and quests
"""
import os
import sys

# Ensure backend root is on sys.path so "app" and "scripts" import correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text  # type: ignore

from scripts import seed


def reset_and_seed() -> None:
    """
    Truncate main domain tables and rerun seed.seed().
    Uses the same DATABASE_URL* envs as scripts.seed.
    """
    database_url = seed.database_url
    engine = create_engine(database_url)

    print("Resetting tables (submissions, test_cases, quests, learners, admins, users)...")
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE submissions, test_cases, quests, learners, admins, users "
                "RESTART IDENTITY CASCADE;"
            )
        )
    print("Tables reset. Reseeding...")
    seed.seed()


if __name__ == "__main__":
    reset_and_seed()

