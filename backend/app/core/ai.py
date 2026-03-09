"""
AI helper for generating code hints.

This module talks to an OpenAI-compatible chat completions API using httpx.
Configuration is provided via Settings (ai_api_base, ai_api_key, ai_model).
"""

from __future__ import annotations

import asyncio
import hashlib
import time

import httpx

from app.config import get_settings

_ai_state = {"failure_count": 0, "open_until": 0.0}

# Simple in-memory cache for identical requests (best-effort; resets on restart).
_AI_HINT_CACHE: dict[str, tuple[float, str]] = {}

# Tuning knobs (safe defaults for a student project).
_AI_TIMEOUT_SECONDS = 20.0
_AI_MAX_RETRIES = 2  # total attempts = 1 + retries
_AI_BACKOFF_BASE_SECONDS = 0.6
_AI_CIRCUIT_FAILURE_THRESHOLD = 3
_AI_CIRCUIT_OPEN_SECONDS = 60
_AI_CACHE_TTL_SECONDS = 10 * 60  # 10 minutes


def _cache_key(*, quest_title: str, quest_description: str, learner_code: str, last_output: str | None) -> str:
    raw = "\n".join([quest_title, quest_description, learner_code, last_output or ""])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _circuit_open() -> bool:
    return time.time() < float(_ai_state["open_until"])


def _note_failure() -> None:
    _ai_state["failure_count"] = int(_ai_state["failure_count"]) + 1
    if int(_ai_state["failure_count"]) >= _AI_CIRCUIT_FAILURE_THRESHOLD:
        _ai_state["open_until"] = time.time() + _AI_CIRCUIT_OPEN_SECONDS
        _ai_state["failure_count"] = 0


def _note_success() -> None:
    _ai_state["failure_count"] = 0
    _ai_state["open_until"] = 0.0


async def generate_hint(
    *,
    quest_title: str,
    quest_description: str,
    learner_code: str,
    last_output: str | None,
    hint_number: int | None = None,
) -> str:
    """
    Call the configured AI model to generate a short, instructional hint.
    Returns plain text; does NOT reveal the full solution.
    """
    settings = get_settings()
    if not settings.ai_api_base or not settings.ai_api_key:
        raise RuntimeError(
            "AI hint service is not configured. "
            "Set AI_API_BASE and AI_API_KEY (and optionally AI_MODEL) in the backend .env."
        )

    if _circuit_open():
        raise RuntimeError("AI hints are temporarily unavailable. Please try again in a few moments.")

    stage = int(hint_number or 1)
    key = _cache_key(
        quest_title=quest_title,
        quest_description=quest_description,
        learner_code=learner_code,
        last_output=last_output,
    )
    # Stage-specific cache key so Hint #2 isn't reused as Hint #1, etc.
    key = f"{stage}:{key}"
    cached = _AI_HINT_CACHE.get(key)
    if cached:
        expires_at, hint = cached
        if time.time() < expires_at:
            return hint
        _AI_HINT_CACHE.pop(key, None)

    stage_instructions = {
        1: (
            "Give a general hint. Describe what concept to check (e.g. variable assignment order, loop condition, key lookup)."
        ),
        2: (
            "Be more specific. Point to the most likely area (a line or expression) and what to change (but do NOT provide the final code)."
        ),
        3: (
            "Be very specific. Identify the exact bug pattern and the minimal fix direction (still do NOT provide the full fixed code)."
        ),
    }

    system_prompt = (
        "You are a gentle debugging tutor for beginner programmers.\n"
        "Given a quest description, the learner's current Python code, and the output/error, "
        "provide ONE short hint (2-3 sentences) that nudges them toward the fix.\n"
        "Rules:\n"
        "- Do NOT give the full solution or rewrite the entire code.\n"
        "- Do NOT paste the final corrected code.\n"
        "- You may reference a line, variable, operator, or condition.\n"
        f"Hint stage: {stage}. {stage_instructions.get(stage, stage_instructions[1])}"
    )

    user_content = (
        f"Quest title: {quest_title}\n"
        f"Quest description: {quest_description}\n\n"
        f"Current code:\n```python\n{learner_code}\n```\n\n"
        f"Last output or error:\n{last_output or '(no output captured yet)'}\n"
    )

    payload = {
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.4,
        "max_tokens": 256,
    }

    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json",
    }

    last_exc: Exception | None = None
    for attempt in range(_AI_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(base_url=settings.ai_api_base, timeout=_AI_TIMEOUT_SECONDS) as client:
                resp = await client.post("/chat/completions", json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            try:
                hint = data["choices"][0]["message"]["content"].strip()
            except Exception as exc:  # pragma: no cover - defensive
                raise RuntimeError("AI provider returned an unexpected response format") from exc

            _note_success()
            _AI_HINT_CACHE[key] = (time.time() + _AI_CACHE_TTL_SECONDS, hint)
            return hint
        except httpx.HTTPStatusError as exc:
            last_exc = exc
            status = exc.response.status_code
            # Retry transient errors only
            if status in (429, 500, 502, 503, 504) and attempt < _AI_MAX_RETRIES:
                await asyncio.sleep(_AI_BACKOFF_BASE_SECONDS * (2**attempt))
                continue
            _note_failure()
            raise
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_exc = exc
            if attempt < _AI_MAX_RETRIES:
                await asyncio.sleep(_AI_BACKOFF_BASE_SECONDS * (2**attempt))
                continue
            _note_failure()
            raise RuntimeError("AI hints are temporarily unavailable. Please try again in a few moments.") from exc

    # Should never reach here, but keep a safe fallback.
    _note_failure()
    raise RuntimeError("AI hints are temporarily unavailable. Please try again in a few moments.") from last_exc

