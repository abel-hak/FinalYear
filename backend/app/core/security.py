"""
Security helpers: password hashing, JWT tokens, and auth dependencies.

Per documentation:
- JWT-based authentication
- Roles: 'learner' and 'admin'
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.session import get_db
from app.models.user import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Create a bcrypt hash for the given password."""
    # bcrypt limit is 72 bytes; truncate longer secrets defensively
    if isinstance(password, str):
        password_bytes = password.encode("utf-8")
    else:
        password_bytes = password
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT containing the user id as `sub`."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=30)
    )
    to_encode = {"sub": subject, "exp": expire}
    # SECRET_KEY and JWT_ALGORITHM should be set in .env
    secret = getattr(settings, "jwt_secret_key", None) or "dev-secret-change-me"
    algorithm = getattr(settings, "jwt_algorithm", "HS256")
    return jwt.encode(to_encode, secret, algorithm=algorithm)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """FastAPI dependency: resolve User from Authorization: Bearer <token>."""
    settings = get_settings()
    secret = getattr(settings, "jwt_secret_key", None) or "dev-secret-change-me"
    algorithm = getattr(settings, "jwt_algorithm", "HS256")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_id = sub
    result = await db.execute(select(User).where(User.id == user_id, User.is_deleted.is_(False)))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user


async def get_current_learner(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure current user has learner role."""
    if current_user.role != "learner":
        raise HTTPException(status_code=403, detail="Learner access required")
    return current_user


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure current user has admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

