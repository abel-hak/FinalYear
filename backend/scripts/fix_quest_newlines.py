"""
Fix quest code newlines stored as literal '\\n' in the database.

Some seed/import flows can accidentally store backslash-n characters in `initial_code` and `solution_code`.
This script converts those to real newlines for all non-deleted quests.

Usage (from backend directory):
    python -m scripts.fix_quest_newlines
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
if not database_url or database_url == "postgresql+psycopg://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env")
    sys.exit(1)

from app.models.quest import Quest


def _fix(s: str) -> tuple[str, bool]:
    if s is None:
        return s, False
    new = s.replace("\\r\\n", "\n").replace("\\n", "\n")
    return new, new != s


def main() -> None:
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        quests = session.query(Quest).filter(Quest.is_deleted.is_(False)).all()
        changed = 0
        for q in quests:
            ic, c1 = _fix(q.initial_code)
            sc, c2 = _fix(q.solution_code)
            if c1:
                q.initial_code = ic
            if c2:
                q.solution_code = sc
            if c1 or c2:
                changed += 1
        session.commit()
        print(f"Done. Updated {changed} quest(s).")
    except Exception as e:
        session.rollback()
        print(f"Failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()

