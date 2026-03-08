import asyncio
import os
import sys
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.pool import NullPool

# Ensure backend root is on sys.path so `app` is importable when running pytest.
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # type: ignore  # noqa: E402
from app.db.session import get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """
    Async HTTP client against the live FastAPI app.
    Uses NullPool for tests to avoid asyncpg 'another operation in progress' on Windows.
    """
    from app.config import get_settings

    settings = get_settings()
    test_engine = create_async_engine(
        settings.database_url,
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

