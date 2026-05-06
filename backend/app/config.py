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

    # AI hint service (OpenAI-compatible)
    ai_api_base: str | None = None  # e.g. "https://api.openai.com/v1"
    ai_api_key: str | None = None
    ai_model: str = "gpt-4o-mini"

    # Judge0 code execution (used for sandboxed multi-language submissions).
    # Dev: RapidAPI Judge0 CE. Prod: self-hosted Judge0 instance.
    judge0_base_url: str | None = None  # e.g. "https://judge0-ce.p.rapidapi.com"
    judge0_api_key: str | None = None  # RapidAPI key (only needed for RapidAPI host)
    judge0_api_host: str | None = None  # e.g. "judge0-ce.p.rapidapi.com"
    judge0_timeout_seconds: int = 10
    # Local sandbox fallback: only enable in dev/offline; never in production.
    use_local_sandbox: bool = False

    # Rate limiting (NFR-01.4, NFR-10.3)
    submission_rate_limit_per_minute: int = 5

    # Data retention (NFR-11.2)
    submission_retention_days: int = 30


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
