"""
Seed script (Phase 4 + 5): adds 5 Java and 5 C++ debugging quests with test
cases, plus a "Java Foundations" and "C++ Foundations" learning path that
groups them.

Usage (from backend directory):
    python -m scripts.seed_extra_languages

Notes:
- Idempotent: re-running is safe.
    * If quests already exist, quest seeding is skipped.
    * If a Java/C++ path already exists, that path is skipped.
- Quests are placed at high order_ranks (101-105 for Java, 201-205 for C++) so
  they do not collide with the 30 Python quests (1-30). Per-language paths
  are how learners actually reach them.
- Before inserting each quest the script verifies that solution_code, when run
  through the configured CodeRunner (Judge0 by default), produces exactly the
  expected output. If any verification fails, no rows are inserted.
"""

from __future__ import annotations

import asyncio
import os
import sys
import uuid
from pathlib import Path

# Make `app` importable when running as a module from the backend directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env if present (mirrors the pattern used by scripts.seed_30_quests).
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

database_url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get(
    "DATABASE_URL", ""
).replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
if not database_url:
    print(
        "Set DATABASE_URL or DATABASE_URL_SYNC in .env "
        "(e.g. postgresql+psycopg://user:pass@localhost:5432/codequest)"
    )
    sys.exit(1)

# pylint: disable=wrong-import-position
from app.core.code_runner import CodeRunnerError, get_code_runner
from app.models.learning_path import LearningPath, LearningPathQuest
from app.models.quest import Quest
from app.models.test_case import TestCase


# ---------------------------------------------------------------------------
# Quest definitions
# ---------------------------------------------------------------------------
#
# Every quest must:
#   * compile and run on Judge0 (lang_id 62 for Java, 54 for C++).
#   * have a deterministic stdout that exactly matches expected_output (after
#     trailing-newline normalisation done by the submission service).
#   * use class name `Main` for Java (Judge0 default for language id 62).
#
# Difficulty curve mirrors the Python seed: 2 level-1, 2 level-2, 1 level-3
# per language.
# ---------------------------------------------------------------------------


JAVA_QUESTS: list[dict] = [
    dict(
        order_rank=101,
        level=1,
        title="Java: fix the Hello World typo",
        description=(
            "The program should print `Hello, World!` but it does not even "
            "compile. Fix the typo so it runs and prints the greeting."
        ),
        tags=["java", "syntax", "hello-world"],
        initial_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            '        Sytsem.out.println("Hello, World!");\n'
            "    }\n"
            "}\n"
        ),
        solution_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            '        System.out.println("Hello, World!");\n'
            "    }\n"
            "}\n"
        ),
        expected_output="Hello, World!\n",
        explanation=(
            "`Sytsem` is misspelled. The class is `System` (note the order of "
            "letters). Correcting the spelling makes the program compile and "
            "print the expected greeting."
        ),
    ),
    dict(
        order_rank=102,
        level=1,
        title="Java: print the correct sum",
        description=(
            "The code is supposed to print `7` but it prints `6`. Fix the "
            "values so the sum becomes 7."
        ),
        tags=["java", "arithmetic", "variables"],
        initial_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        int a = 3;\n"
            "        int b = 3;\n"
            "        System.out.println(a + b);\n"
            "    }\n"
            "}\n"
        ),
        solution_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        int a = 3;\n"
            "        int b = 4;\n"
            "        System.out.println(a + b);\n"
            "    }\n"
            "}\n"
        ),
        expected_output="7\n",
        explanation=(
            "`a + b` evaluates to `3 + 3 = 6`. Changing `b` to `4` makes the "
            "sum equal 7."
        ),
    ),
    dict(
        order_rank=103,
        level=2,
        title="Java: count from 1 to 5",
        description=(
            "Print every integer from 1 through 5, each on its own line. "
            "The current loop stops one number early."
        ),
        tags=["java", "loops", "off-by-one"],
        initial_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        for (int i = 1; i < 5; i++) {\n"
            "            System.out.println(i);\n"
            "        }\n"
            "    }\n"
            "}\n"
        ),
        solution_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        for (int i = 1; i <= 5; i++) {\n"
            "            System.out.println(i);\n"
            "        }\n"
            "    }\n"
            "}\n"
        ),
        expected_output="1\n2\n3\n4\n5\n",
        explanation=(
            "`i < 5` stops the loop after `i = 4`. Use `i <= 5` to include 5."
        ),
    ),
    dict(
        order_rank=104,
        level=2,
        title="Java: compare strings with .equals",
        description=(
            "The program should print `equal` because both strings hold the "
            "same characters. Currently it prints `not equal`. Fix the "
            "comparison."
        ),
        tags=["java", "strings", "equality"],
        initial_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            '        String a = "hi";\n'
            '        String b = new String("hi");\n'
            "        if (a == b) {\n"
            '            System.out.println("equal");\n'
            "        } else {\n"
            '            System.out.println("not equal");\n'
            "        }\n"
            "    }\n"
            "}\n"
        ),
        solution_code=(
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            '        String a = "hi";\n'
            '        String b = new String("hi");\n'
            "        if (a.equals(b)) {\n"
            '            System.out.println("equal");\n'
            "        } else {\n"
            '            System.out.println("not equal");\n'
            "        }\n"
            "    }\n"
            "}\n"
        ),
        expected_output="equal\n",
        explanation=(
            "`==` compares object references, not contents. Two `String` "
            "objects with identical text but different identity return false. "
            "Use `a.equals(b)` to compare characters."
        ),
    ),
    dict(
        order_rank=105,
        level=3,
        title="Java: add the missing return",
        description=(
            "The helper method `add` should return the sum of its inputs, but "
            "the code does not even compile. Add the missing statement so "
            "calling `add(2, 3)` prints `5`."
        ),
        tags=["java", "methods", "return"],
        initial_code=(
            "public class Main {\n"
            "    public static int add(int x, int y) {\n"
            "        int s = x + y;\n"
            "    }\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(add(2, 3));\n"
            "    }\n"
            "}\n"
        ),
        solution_code=(
            "public class Main {\n"
            "    public static int add(int x, int y) {\n"
            "        int s = x + y;\n"
            "        return s;\n"
            "    }\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(add(2, 3));\n"
            "    }\n"
            "}\n"
        ),
        expected_output="5\n",
        explanation=(
            "A non-void Java method must return a value on every path. Add "
            "`return s;` so `add` actually returns the computed sum."
        ),
    ),
]


CPP_QUESTS: list[dict] = [
    dict(
        order_rank=201,
        level=1,
        title="C++: missing semicolon",
        description=(
            "The program should print `Hello, World!` but it fails to compile. "
            "Add the missing semicolon."
        ),
        tags=["cpp", "syntax", "hello-world"],
        initial_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            '    cout << "Hello, World!" << endl\n'
            "    return 0;\n"
            "}\n"
        ),
        solution_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            '    cout << "Hello, World!" << endl;\n'
            "    return 0;\n"
            "}\n"
        ),
        expected_output="Hello, World!\n",
        explanation=(
            "Every C++ statement must end with `;`. The line that prints the "
            "greeting is missing it, which is why the compiler errors out."
        ),
    ),
    dict(
        order_rank=202,
        level=1,
        title="C++: include the right header",
        description=(
            "The program tries to use `cout` to print `Hello`, but the "
            "compiler does not know what `cout` is. Include the correct "
            "header so it compiles."
        ),
        tags=["cpp", "headers", "compile-error"],
        initial_code=(
            "using namespace std;\n"
            "int main() {\n"
            '    cout << "Hello" << endl;\n'
            "    return 0;\n"
            "}\n"
        ),
        solution_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            '    cout << "Hello" << endl;\n'
            "    return 0;\n"
            "}\n"
        ),
        expected_output="Hello\n",
        explanation=(
            "`cout` and `endl` live in `<iostream>`. Without that include the "
            "compiler cannot find them. Adding `#include <iostream>` fixes the "
            "build."
        ),
    ),
    dict(
        order_rank=203,
        level=2,
        title="C++: count from 1 to 5",
        description=(
            "Print every integer from 1 through 5, each on its own line. "
            "The current loop stops too early."
        ),
        tags=["cpp", "loops", "off-by-one"],
        initial_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    for (int i = 1; i < 5; i++) {\n"
            "        cout << i << endl;\n"
            "    }\n"
            "    return 0;\n"
            "}\n"
        ),
        solution_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    for (int i = 1; i <= 5; i++) {\n"
            "        cout << i << endl;\n"
            "    }\n"
            "    return 0;\n"
            "}\n"
        ),
        expected_output="1\n2\n3\n4\n5\n",
        explanation=(
            "`i < 5` exits the loop after `i = 4`. Use `i <= 5` so 5 is "
            "included."
        ),
    ),
    dict(
        order_rank=204,
        level=2,
        title="C++: sum 1 + 2 + 3 + 4",
        description=(
            "The program should print `10` (the sum of 1 through 4). The "
            "current loop misses the last number."
        ),
        tags=["cpp", "loops", "arithmetic"],
        initial_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int sum = 0;\n"
            "    for (int i = 1; i < 4; i++) {\n"
            "        sum += i;\n"
            "    }\n"
            "    cout << sum << endl;\n"
            "    return 0;\n"
            "}\n"
        ),
        solution_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int sum = 0;\n"
            "    for (int i = 1; i <= 4; i++) {\n"
            "        sum += i;\n"
            "    }\n"
            "    cout << sum << endl;\n"
            "    return 0;\n"
            "}\n"
        ),
        expected_output="10\n",
        explanation=(
            "`i < 4` only sums 1+2+3 = 6. Changing the bound to `i <= 4` "
            "includes 4 so the total is 10."
        ),
    ),
    dict(
        order_rank=205,
        level=3,
        title="C++: avoid integer division",
        description=(
            "Dividing 5 by 2 should produce `2.5`, but the program prints "
            "`2`. Fix the types so the division keeps the fractional part."
        ),
        tags=["cpp", "types", "division"],
        initial_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    int a = 5;\n"
            "    int b = 2;\n"
            "    cout << (a / b) << endl;\n"
            "    return 0;\n"
            "}\n"
        ),
        solution_code=(
            "#include <iostream>\n"
            "using namespace std;\n"
            "int main() {\n"
            "    double a = 5;\n"
            "    double b = 2;\n"
            "    cout << (a / b) << endl;\n"
            "    return 0;\n"
            "}\n"
        ),
        expected_output="2.5\n",
        explanation=(
            "When both operands are `int`, `/` performs integer division and "
            "truncates the remainder. Declaring at least one operand as "
            "`double` makes the division floating-point and preserves `2.5`."
        ),
    ),
]


ALL_QUESTS: list[dict] = []
for q in JAVA_QUESTS:
    ALL_QUESTS.append({**q, "language": "java"})
for q in CPP_QUESTS:
    ALL_QUESTS.append({**q, "language": "cpp"})


# ---------------------------------------------------------------------------
# Verification: run every solution through the configured runner before insert.
# ---------------------------------------------------------------------------


def _norm(text: str) -> str:
    """Match the submission service's comparison: ignore trailing newlines."""
    return (text or "").rstrip("\n").rstrip("\r")


async def _verify_solutions() -> list[str]:
    """Returns a list of error strings (empty list = all good)."""
    errors: list[str] = []
    runner = get_code_runner()
    for q in ALL_QUESTS:
        label = f"[{q['language']}] {q['title']}"
        try:
            result = await runner.run(
                language=q["language"],
                source=q["solution_code"],
                stdin=None,
                timeout_seconds=8,
            )
        except CodeRunnerError as exc:
            errors.append(f"{label}: runner error: {exc}")
            continue

        if result.timed_out:
            errors.append(f"{label}: solution timed out")
            continue
        if result.exit_code != 0:
            errors.append(
                f"{label}: solution exited with {result.exit_code}; "
                f"stderr={result.stderr!r}"
            )
            continue
        if _norm(result.stdout) != _norm(q["expected_output"]):
            errors.append(
                f"{label}: output mismatch\n"
                f"  expected: {q['expected_output']!r}\n"
                f"  got:      {result.stdout!r}"
            )
            continue

        print(f"  OK  {label}")
        # tiny pause to be polite to ce.judge0.com
        await asyncio.sleep(0.4)

    return errors


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------


def _existing_non_python_quest_count(session) -> int:
    return (
        session.query(Quest)
        .filter(Quest.language.in_(["java", "cpp"]))
        .count()
    )


def _existing_path_for_language(session, language: str) -> LearningPath | None:
    return (
        session.query(LearningPath)
        .filter(LearningPath.language == language)
        .order_by(LearningPath.level, LearningPath.order_rank)
        .first()
    )


def _used_order_ranks(session) -> set[int]:
    return {row[0] for row in session.query(Quest.order_rank).all()}


def _used_path_order_ranks(session) -> set[int]:
    return {row[0] for row in session.query(LearningPath.order_rank).all()}


def _seed_quests(session) -> bool:
    """Returns True if quests were inserted, False if skipping."""
    if _existing_non_python_quest_count(session) > 0:
        print(
            "Java/C++ quests already exist; skipping quest seeding. "
            "(Delete them manually if you want to reseed.)"
        )
        return False

    used_ranks = _used_order_ranks(session)
    clashes = [q["order_rank"] for q in ALL_QUESTS if q["order_rank"] in used_ranks]
    if clashes:
        print(
            "Aborting: the following order_rank values are already in use "
            f"by existing quests: {sorted(clashes)}. Update the script."
        )
        sys.exit(2)

    print("\nVerifying every solution against the configured CodeRunner...")
    errors = asyncio.run(_verify_solutions())
    if errors:
        print("\nVerification FAILED. No rows were inserted.")
        for e in errors:
            print(f"  - {e}")
        sys.exit(3)

    print("\nAll solutions verified. Inserting quests + test cases...")
    for q in ALL_QUESTS:
        quest = Quest(
            id=uuid.uuid4(),
            title=q["title"],
            description=q["description"],
            level=q["level"],
            order_rank=q["order_rank"],
            language=q["language"],
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

    print(
        f"Inserted {len(JAVA_QUESTS)} Java + {len(CPP_QUESTS)} C++ quests "
        "(each with one visible test case)."
    )
    return True


def _seed_paths(session) -> None:
    """Create one foundational path per language (Java + C++).

    Idempotent: if a path with the target language already exists this is a
    no-op. We don't try to upsert quest membership because re-runs after
    user-driven admin edits would clobber that.
    """
    used_ranks = _used_path_order_ranks(session)

    PATHS = [
        dict(
            language="java",
            level=1,
            order_rank=100,
            title="Java Foundations",
            description=(
                "Five short Java debugging challenges covering syntax, control "
                "flow, string equality, and methods."
            ),
        ),
        dict(
            language="cpp",
            level=1,
            order_rank=200,
            title="C++ Foundations",
            description=(
                "Five short C++ debugging challenges covering syntax, includes, "
                "loops, and integer-vs-floating-point arithmetic."
            ),
        ),
    ]

    for cfg in PATHS:
        lang = cfg["language"]
        if _existing_path_for_language(session, lang):
            print(
                f"Path for language={lang!r} already exists; "
                "skipping path seeding for it."
            )
            continue

        order_rank = cfg["order_rank"]
        if order_rank in used_ranks:
            # Pick the next free slot above the requested one rather than failing.
            while order_rank in used_ranks:
                order_rank += 1

        path = LearningPath(
            id=uuid.uuid4(),
            title=cfg["title"],
            description=cfg["description"],
            level=cfg["level"],
            order_rank=order_rank,
            language=lang,
        )
        session.add(path)
        session.flush()

        # Pull the quests we just inserted (or existing ones from a prior run)
        # for this language and attach them in their natural order_rank order.
        quests_for_lang = (
            session.query(Quest)
            .filter(Quest.language == lang, Quest.is_deleted.is_(False))
            .order_by(Quest.order_rank)
            .all()
        )
        for i, quest in enumerate(quests_for_lang, start=1):
            session.add(
                LearningPathQuest(
                    id=uuid.uuid4(),
                    path_id=path.id,
                    quest_id=quest.id,
                    order_rank=i,
                )
            )

        used_ranks.add(order_rank)
        print(
            f"Created path '{cfg['title']}' with {len(quests_for_lang)} quests "
            f"(language={lang}, order_rank={order_rank})."
        )


def seed() -> None:
    print("Phase 4 + 5: seeding Java/C++ quests and per-language paths")
    print(f"DB: {database_url}")

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        _seed_quests(session)
        _seed_paths(session)
        session.commit()
        print("\nDone.")
    except Exception as exc:  # noqa: BLE001
        session.rollback()
        print(f"Seed failed: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
