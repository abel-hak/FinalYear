"""
Database session and engine setup.
Uses async SQLAlchemy for FastAPI; sync engine for Alembic migrations.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.db.base import Base


def get_async_engine():
    """Create async engine from DATABASE_URL (postgresql+asyncpg://...)."""
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        echo=settings.debug,
        future=True,
    )


def get_sync_url() -> str:
    """Return sync PostgreSQL URL for Alembic (postgresql://...)."""
    settings = get_settings()
    if settings.database_url_sync:
        return settings.database_url_sync
    # Convert asyncpg URL to psycopg2-style for Alembic
    url = settings.database_url
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


# Async session factory for FastAPI dependency injection
async_engine = get_async_engine()
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """
    FastAPI dependency: yield an async DB session.
    Ensures session is closed after request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Sync engine and session for Alembic (migrations run outside async context)
sync_url = get_sync_url()
sync_engine = create_engine(sync_url, echo=get_settings().debug, future=True)
SyncSessionLocal = sessionmaker(sync_engine, autocommit=False, autoflush=False)
