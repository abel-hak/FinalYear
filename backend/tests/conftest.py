import asyncio
import os
import sys
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import AsyncClient

# Ensure backend root is on sys.path so `app` is importable when running pytest.
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # type: ignore  # noqa: E402


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Async HTTP client against the live FastAPI app."""
    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        yield ac

