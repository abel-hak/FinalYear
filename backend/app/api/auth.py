"""
Auth endpoints: register and login.

Per documentation:
- User selects role (Learner or Admin) at registration.
- JWT-based login.
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.models.learner import Learner
from app.models.admin import Admin
from app.schemas.auth import UserCreate, UserPublic, Token
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=201)
async def register_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new learner or admin account."""
    # Ensure username/email are unique
    existing = await db.execute(
        select(User).where(
            (User.username == payload.username) | (User.email == payload.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.flush()

    if payload.role == "learner":
        learner = Learner(user_id=user.id)
        db.add(learner)
    else:
        admin = Admin(user_id=user.id, admin_status="active")
        db.add(admin)

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 password flow login.
    Accepts username + password; returns JWT access token.
    """
    result = await db.execute(
        select(User).where(User.username == form_data.username, User.is_deleted.is_(False))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = get_settings()
    minutes = getattr(settings, "access_token_expire_minutes", 30)
    access_token_expires = timedelta(minutes=minutes)
    access_token = create_access_token(subject=str(user.id), expires_delta=access_token_expires)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserPublic)
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserPublic:
    """Return the currently authenticated user's public profile."""
    return current_user


