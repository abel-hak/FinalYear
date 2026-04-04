"""
Purge submissions older than retention period (NFR-11.2).

Keeps the most recent passed submission per (learner, quest) for progress.
Deletes: failed submissions older than retention_days, and older passed
submissions when a newer passed exists for the same learner+quest.

Run from backend dir: python -m scripts.purge_submissions
Schedule via cron (e.g. daily): 0 2 * * * cd /path/to/backend && python -m scripts.purge_submissions

Requires: DATABASE_URL_SYNC or DATABASE_URL set.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

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

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
if not database_url or database_url == "postgresql+psycopg://user:password@localhost:5432/codequest":
    print("Set DATABASE_URL or DATABASE_URL_SYNC in .env")
    sys.exit(1)

retention_days = int(os.environ.get("SUBMISSION_RETENTION_DAYS", "30"))
cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

engine = create_engine(database_url)
Session = sessionmaker(bind=engine)


def purge():
    """Delete submissions older than retention period, preserving progress."""
    with Session() as session:
        # 1. Delete old failed submissions
        r1 = session.execute(
            text("""
                DELETE FROM submissions
                WHERE created_at < :cutoff AND passed = false
            """),
            {"cutoff": cutoff},
        )
        failed_deleted = r1.rowcount

        # 2. Delete old passed submissions where a newer passed exists for same (learner, quest)
        r2 = session.execute(
            text("""
                DELETE FROM submissions s
                WHERE s.created_at < :cutoff
                AND s.passed = true
                AND EXISTS (
                    SELECT 1 FROM submissions s2
                    WHERE s2.learner_id = s.learner_id
                    AND s2.quest_id = s.quest_id
                    AND s2.passed = true
                    AND s2.created_at >= :cutoff
                )
            """),
            {"cutoff": cutoff},
        )
        passed_deleted = r2.rowcount

        session.commit()
        return failed_deleted + passed_deleted


if __name__ == "__main__":
    print(f"Purging submissions older than {retention_days} days (before {cutoff.isoformat()})...")
    deleted = purge()
    print(f"Purged {deleted} submission(s).")
