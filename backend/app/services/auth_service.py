"""Auth service orchestration.

Controllers should delegate auth workflows to this service and map service errors to HTTP responses.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.rate_limit import _login_limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import Token, UserCreate


@dataclass
class AuthConflictError(Exception):
    message: str


@dataclass
class AuthRateLimitError(Exception):
    message: str


@dataclass
class AuthInvalidCredentialsError(Exception):
    message: str


class AuthService:
    """Application service for registration and login."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AuthRepository(db)

    async def register_user(self, payload: UserCreate) -> User:
        async with self.db.begin():
            existing = await self.repo.find_by_username_or_email(payload.username, payload.email)
            if existing:
                raise AuthConflictError("Username or email already exists")

            user = await self.repo.create_user_with_role_profiles(
                username=payload.username,
                email=payload.email,
                password_hash=hash_password(payload.password),
                role=payload.role,
            )

        await self.db.refresh(user)
        return user

    async def login(self, *, username: str, password: str, client_ip: str) -> Token:
        if not _login_limiter.is_allowed(f"login:{client_ip}"):
            raise AuthRateLimitError("Too many login attempts. Please try again in a minute.")

        user = await self.repo.find_active_by_username(username)
        if not user or not verify_password(password, user.password_hash):
            raise AuthInvalidCredentialsError("Incorrect username or password")

        settings = get_settings()
        minutes = getattr(settings, "access_token_expire_minutes", 30)
        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=minutes),
        )
        return Token(access_token=access_token)
