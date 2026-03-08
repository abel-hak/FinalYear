"""
M6: Quest submission flow integration tests.

Tests that a learner can submit code, get pass/fail, progress updates, and rate limiting.
"""
import uuid

import pytest
from httpx import AsyncClient


async def _login_learner(client: AsyncClient) -> str:
    """Login as learner1 and return access token."""
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


async def _register_and_login_fresh_learner(client: AsyncClient) -> str:
    """Register a new learner and return token. Use when we need zero prior submissions."""
    uid = str(uuid.uuid4())[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"ratetest_{uid}",
            "email": f"ratetest_{uid}@test.dev",
            "password": "test123",
            "role": "learner",
        },
    )
    assert resp.status_code == 201, resp.text
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": f"ratetest_{uid}", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _get_first_quest(client: AsyncClient, token: str) -> dict:
    """Get first quest detail (current quest for learner)."""
    progress = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200
    quests = progress.json().get("quests", [])
    assert quests, "Need at least one quest"
    quest_id = quests[0]["id"]

    detail = await client.get(
        f"/api/v1/quests/{quest_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert detail.status_code == 200
    return detail.json()


@pytest.mark.asyncio
async def test_submit_failing_code_returns_error(client: AsyncClient) -> None:
    """Submitting incorrect code returns passed=False."""
    token = await _login_learner(client)
    quest = await _get_first_quest(client, token)
    quest_id = quest["id"]

    # Seed quest 1: solution is x=7, initial has x=5. Submit wrong code.
    resp = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "x = 5\nprint(x + 3)"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is False
    assert "tests_passed" in body
    assert "tests_total" in body


@pytest.mark.asyncio
async def test_submit_passing_code_returns_success(client: AsyncClient) -> None:
    """Submitting correct code returns passed=True and updates progress."""
    token = await _login_learner(client)
    quest = await _get_first_quest(client, token)
    quest_id = quest["id"]

    # Quest 1 expects output "10\n". Solution: x = 7, print(x + 3)
    resp = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "x = 7\nprint(x + 3)"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["passed"] is True
    assert body["tests_passed"] == body["tests_total"]
    assert body["tests_total"] >= 1

    # Progress should reflect completion
    progress = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200
    quests = progress.json().get("quests", [])
    completed = [q for q in quests if q["status"] == "completed"]
    assert len(completed) >= 1


@pytest.mark.asyncio
async def test_submit_requires_auth(client: AsyncClient) -> None:
    """Submit endpoint requires valid JWT."""
    # Use a valid UUID format for a non-existent quest
    resp = await client.post(
        "/api/v1/quests/00000000-0000-0000-0000-000000000001/submit",
        json={"code": "print(1)"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_submit_rate_limit_5_per_minute(client: AsyncClient, monkeypatch) -> None:
    """After N submissions in 1 minute, next returns 429 (NFR-01.4, NFR-10.3)."""
    # Use limit=2 in tests so we only need 3 submissions
    monkeypatch.setenv("SUBMISSION_RATE_LIMIT_PER_MINUTE", "2")
    from app.config import get_settings
    get_settings.cache_clear()
    try:
        token = await _register_and_login_fresh_learner(client)
        quest = await _get_first_quest(client, token)
        quest_id = quest["id"]

        # Submit 2 times - all should succeed (wrong code is fine)
        for i in range(2):
            resp = await client.post(
                f"/api/v1/quests/{quest_id}/submit",
                json={"code": "print(1)"},
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200, f"Submission {i+1}: expected 200, got {resp.status_code}: {resp.text}"

        # 3rd submission should be rate limited (429)
        resp = await client.post(
            f"/api/v1/quests/{quest_id}/submit",
            json={"code": "print(1)"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 429, f"Expected 429 (rate limit), got {resp.status_code}: {resp.text}"
        body = resp.json()
        assert "detail" in body
        assert "rate limit" in body["detail"].lower() or "2" in body["detail"]
    finally:
        monkeypatch.delenv("SUBMISSION_RATE_LIMIT_PER_MINUTE", raising=False)
        get_settings.cache_clear()
