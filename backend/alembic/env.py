"""
Alembic environment: use sync DB URL and our Base + models for autogenerate.
Run from backend dir: alembic upgrade head
"""
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import app config and Base + all models so Alembic can see the schema
from app.config import get_settings
from app.db.base import Base
from app import models  # noqa: F401 - register all models

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set sqlalchemy.url from our env (sync URL)
settings = get_settings()
sync_url = (
    settings.database_url_sync
    if settings.database_url_sync
    else settings.database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
)
config.set_main_option("sqlalchemy.url", sync_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode (no DB connection).
    Generates SQL script only.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode (connects to DB).
    """
    connectable = context.config.attributes.get("connection", None)
    if connectable is None:
        connectable = context.config.attributes.get("sqlalchemy.url")
    from sqlalchemy import create_engine
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
