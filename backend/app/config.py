"""
Application configuration loaded from environment variables.
Uses pydantic-settings for validation and .env support.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central config for CodeQuest API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database (env: DATABASE_URL, DATABASE_URL_SYNC)
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/codequest"
    database_url_sync: str | None = None  # For Alembic; fallback = sync version of database_url

    # App
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api/v1"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
