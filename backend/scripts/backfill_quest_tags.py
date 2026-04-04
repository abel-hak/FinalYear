"""Backfill tags for existing quests (run once after migration 005)."""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

from sqlalchemy import create_engine, text

url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg://", 1
)
engine = create_engine(url)
with engine.begin() as conn:
    conn.execute(text('UPDATE quests SET tags = \'["variables", "arithmetic"]\'::jsonb WHERE order_rank = 1'))
    conn.execute(text('UPDATE quests SET tags = \'["loops", "range"]\'::jsonb WHERE order_rank = 2'))
    conn.execute(text('UPDATE quests SET tags = \'["conditions", "modulo"]\'::jsonb WHERE order_rank = 3'))
print("Backfilled tags for existing quests.")
