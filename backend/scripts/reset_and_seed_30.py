"""
Reset and reseed the CodeQuest database with the 30-quest pack.

Usage (from backend directory):
    python -m scripts.reset_and_seed_30

This will:
- TRUNCATE learning_path_quests, learning_paths, submissions, test_cases, quests, learners, admins, users
- RESTART IDENTITY CASCADE
- Call scripts.seed_30_quests.seed() to insert demo users + 30 quests + paths
"""

import os
import sys

# Ensure backend root is on sys.path so "app" and "scripts" import correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text  # type: ignore

from scripts import seed_30_quests


def reset_and_seed() -> None:
    database_url = seed_30_quests.database_url
    engine = create_engine(database_url)

    print(
        "Resetting tables (learning_path_quests, learning_paths, submissions, test_cases, quests, learners, admins, users)..."
    )
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE learning_path_quests, learning_paths, submissions, test_cases, quests, learners, admins, users "
                "RESTART IDENTITY CASCADE;"
            )
        )
    print("Tables reset. Reseeding 30 quests...")
    seed_30_quests.seed()


if __name__ == "__main__":
    reset_and_seed()

