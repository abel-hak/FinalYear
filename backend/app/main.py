"""
CodeQuest API - FastAPI application entry point.
Health check and API prefix; routes mounted in api/ package.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api import auth as auth_routes
from app.api import quests as quest_routes
from app.api import progress as progress_routes
from app.api import admin as admin_routes

app = FastAPI(
    title="CodeQuest API",
    description="Debugging-based learning platform API",
    version="0.1.0",
)

settings = get_settings()

# CORS for frontend (Next.js dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"] if not settings.debug else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_prefix = get_settings().api_prefix

# Mount API routers under the configured prefix (e.g. /api/v1)
app.include_router(auth_routes.router, prefix=api_prefix)
app.include_router(quest_routes.router, prefix=api_prefix)
app.include_router(progress_routes.router, prefix=api_prefix)
app.include_router(admin_routes.router, prefix=api_prefix)


@app.get("/health")
def health_check():
    """
    Health check for load balancers and monitoring.
    Returns 200 when the API is up.
    """
    return {"status": "ok", "service": "codequest-api"}


@app.get("/")
def root():
    """Root redirect or info."""
    return {
        "message": "CodeQuest API",
        "docs": "/docs",
        "health": "/health",
        "api_prefix": settings.api_prefix,
    }
