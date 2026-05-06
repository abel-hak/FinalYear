"""
Smoke-test the Java + C++ quests end-to-end through the configured CodeRunner.

For one Java and one C++ quest we:
  1. Fetch the quest + its first test case from the database.
  2. Run initial_code through the runner and assert it does NOT match
     expected_output (broken on purpose).
  3. Run solution_code through the runner and assert it DOES match.

This exercises the same path /quests/{id}/submit uses (runner.run + the
trailing-newline-stripped string comparison) without writing submission rows.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get(
    "DATABASE_URL", ""
).replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
if not url:
    print("no db url"); sys.exit(1)

from sqlalchemy import create_engine, text  # noqa: E402

from app.core.code_runner import get_code_runner  # noqa: E402


def _load(language: str, order_rank: int) -> dict:
    eng = create_engine(url)
    with eng.connect() as c:
        row = c.execute(
            text(
                "SELECT q.id, q.title, q.language, q.initial_code, q.solution_code, "
                "       tc.expected_output "
                "FROM quests q "
                "JOIN test_cases tc ON tc.quest_id = q.id "
                "WHERE q.language = :lang AND q.order_rank = :rank "
                "LIMIT 1"
            ),
            {"lang": language, "rank": order_rank},
        ).mappings().first()
    if not row:
        raise SystemExit(f"Quest not found for {language} rank={order_rank}")
    return dict(row)


def _norm(s: str) -> str:
    return (s or "").rstrip("\n").rstrip("\r")


async def _check_one(quest: dict) -> None:
    label = f"[{quest['language']}] {quest['title']}"
    runner = get_code_runner()

    print(f"\n--- {label} ---")
    print("  Running initial_code (should NOT match expected)...")
    bad = await runner.run(
        language=quest["language"],
        source=quest["initial_code"],
        timeout_seconds=8,
    )
    bad_match = _norm(bad.stdout) == _norm(quest["expected_output"])
    print(
        f"    exit={bad.exit_code} timed_out={bad.timed_out} "
        f"stdout={bad.stdout!r} stderr={bad.stderr[:120]!r}"
    )
    if bad_match:
        raise SystemExit(f"FAIL: {label} initial_code unexpectedly matches expected_output")
    print("    OK initial_code does NOT match expected (as required)")

    await asyncio.sleep(0.5)

    print("  Running solution_code (must match expected)...")
    good = await runner.run(
        language=quest["language"],
        source=quest["solution_code"],
        timeout_seconds=8,
    )
    good_match = _norm(good.stdout) == _norm(quest["expected_output"])
    print(
        f"    exit={good.exit_code} timed_out={good.timed_out} "
        f"stdout={good.stdout!r}"
    )
    if not good_match:
        raise SystemExit(f"FAIL: {label} solution_code did not match expected_output")
    print("    OK solution_code matches expected")


async def main() -> None:
    java_q = _load("java", 101)  # Hello World typo
    cpp_q = _load("cpp", 201)    # missing semicolon
    await _check_one(java_q)
    await asyncio.sleep(0.5)
    await _check_one(cpp_q)
    print("\nPhase 4 end-to-end smoke: PASSED")


if __name__ == "__main__":
    asyncio.run(main())
