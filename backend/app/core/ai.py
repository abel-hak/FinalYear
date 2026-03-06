from __future__ import annotations

"""
AI helper for generating code hints.

This module talks to an OpenAI-compatible chat completions API using httpx.
Configuration is provided via Settings (ai_api_base, ai_api_key, ai_model).
"""

from typing import Optional

import httpx

from app.config import get_settings


async def generate_hint(
    *,
    quest_title: str,
    quest_description: str,
    learner_code: str,
    last_output: str | None,
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

    system_prompt = (
        "You are a gentle debugging tutor for beginner programmers.\n"
        "Given a quest description, the learner's current Python code, and the output/error, "
        "provide ONE short hint (2-3 sentences) that nudges them toward the fix without giving "
        "away the full solution or rewriting the entire code.\n"
        "Focus on explaining what to look at (e.g. a specific line, variable, or condition)."
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

    async with httpx.AsyncClient(base_url=settings.ai_api_base, timeout=20.0) as client:
        resp = await client.post("/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    try:
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:  # pragma: no cover - defensive
        raise RuntimeError("AI provider returned an unexpected response format") from exc

