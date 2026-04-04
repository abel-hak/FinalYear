import asyncio
import os
import sys
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

# Ensure backend root is on sys.path so `app` is importable when running pytest.
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # type: ignore  # noqa: E402
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


def _load_test_env_file() -> None:
    """Load backend/.env.test if it exists, overriding process env for test runs."""
    env_path = Path(BACKEND_ROOT) / ".env.test"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ[key.strip()] = value.strip().strip('"').strip("'")


_load_test_env_file()


def _validate_db_name(name: str) -> None:
    """Allow only safe PostgreSQL identifier characters for dynamic DB names."""
    if not name.replace("_", "").isalnum():
        raise ValueError(f"Unsafe test database name: {name}")


def _admin_db_url() -> str:
    return os.environ.get(
        "TEST_DATABASE_ADMIN_URL",
        "postgresql+psycopg://codequest_test:codequest_test@localhost:5433/postgres",
    )


def _db_name_prefix() -> str:
    return os.environ.get("TEST_DATABASE_NAME_PREFIX", "codequest_test")


def _db_url_templates() -> tuple[str, str]:
    async_template = os.environ.get(
        "TEST_DATABASE_URL_TEMPLATE",
        "postgresql+asyncpg://codequest_test:codequest_test@localhost:5433/{db_name}",
    )
    sync_template = os.environ.get(
        "TEST_DATABASE_SYNC_URL_TEMPLATE",
        "postgresql+psycopg://codequest_test:codequest_test@localhost:5433/{db_name}",
    )
    return async_template, sync_template


def _build_db_urls(db_name: str) -> tuple[str, str]:
    async_template, sync_template = _db_url_templates()
    return (
        async_template.format(db_name=db_name),
        sync_template.format(db_name=db_name),
    )


def _create_database(db_name: str) -> None:
    """Create a new temporary test database."""
    _validate_db_name(db_name)
    engine = create_engine(_admin_db_url(), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        engine.dispose()


def _drop_database(db_name: str) -> None:
    """Terminate active connections and drop temporary test database."""
    _validate_db_name(db_name)
    engine = create_engine(_admin_db_url(), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    """
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = :db_name
                      AND pid <> pg_backend_pid()
                    """
                ),
                {"db_name": db_name},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}"'))
    finally:
        engine.dispose()


def _seed_database(db_sync_url: str) -> None:
    """Seed baseline users/quests expected by integration tests."""
    from sqlalchemy.orm import sessionmaker
    from scripts import seed as seed_script

    seed_script.database_url = db_sync_url
    seed_script.engine = create_engine(db_sync_url)
    seed_script.Session = sessionmaker(bind=seed_script.engine)
    try:
        seed_script.seed()
    finally:
        seed_script.engine.dispose()


async def _init_schema_and_seed(db_async_url: str, db_sync_url: str) -> None:
    """Create schema from ORM metadata, then seed canonical test data."""
    from app.db.base import Base
    import app.models  # noqa: F401  # Ensure model metadata is registered

    schema_engine = create_async_engine(db_async_url, poolclass=NullPool, echo=False)
    try:
        async with schema_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    finally:
        await schema_engine.dispose()

    await asyncio.to_thread(_seed_database, db_sync_url)


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """
    Async HTTP client against the live FastAPI app.
    Uses NullPool for tests to avoid asyncpg 'another operation in progress' on Windows.
    """
    from app.config import get_settings

    db_name = f"{_db_name_prefix()}_{uuid.uuid4().hex}"
    await asyncio.to_thread(_create_database, db_name)
    db_async_url, db_sync_url = _build_db_urls(db_name)

    original_async_url = os.environ.get("DATABASE_URL")
    original_sync_url = os.environ.get("DATABASE_URL_SYNC")
    os.environ["DATABASE_URL"] = db_async_url
    os.environ["DATABASE_URL_SYNC"] = db_sync_url
    get_settings.cache_clear()

    await _init_schema_and_seed(db_async_url, db_sync_url)

    test_engine = create_async_engine(
        db_async_url,
        poolclass=NullPool,
        echo=False,
    )
    TestSessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_db():
        async with TestSessionLocal() as s:
            try:
                yield s
                await s.commit()
            except Exception:
                await s.rollback()
                raise
            finally:
                await s.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(app=app, base_url="http://testserver") as ac:
            yield ac
    finally:
        app.dependency_overrides.pop(get_db, None)
        await test_engine.dispose()
        if original_async_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = original_async_url
        if original_sync_url is None:
            os.environ.pop("DATABASE_URL_SYNC", None)
        else:
            os.environ["DATABASE_URL_SYNC"] = original_sync_url
        get_settings.cache_clear()
        await asyncio.to_thread(_drop_database, db_name)

