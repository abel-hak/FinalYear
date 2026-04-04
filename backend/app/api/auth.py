"""Auth endpoints: thin controllers that delegate to auth services."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserPublic, Token
from app.core.security import (
    get_current_user,
)
from app.services.auth_service import (
    AuthConflictError,
    AuthInvalidCredentialsError,
    AuthRateLimitError,
    AuthService,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=201)
async def register_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new learner or admin account."""
    service = AuthService(db)
    try:
        return await service.register_user(payload)
    except AuthConflictError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc


def _get_client_ip(request: Request) -> str:
    """Get client IP, considering X-Forwarded-For when behind proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 password flow login.
    Accepts username + password; returns JWT access token.
    Rate limited: 5 attempts per minute per IP.
    """
    service = AuthService(db)
    try:
        return await service.login(
            username=form_data.username,
            password=form_data.password,
            client_ip=_get_client_ip(request),
        )
    except AuthRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=exc.message,
        ) from exc
    except AuthInvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.get("/me", response_model=UserPublic)
async def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Return the currently authenticated user's public profile."""
    return current_user


