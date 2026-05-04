"""
M6: Quest submission flow integration tests.

Tests that a learner can submit code, get pass/fail, progress updates, rate limiting,
and System Busy for system errors (NFR-01.3).
"""
import uuid
from unittest.mock import patch

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


async def _admin_token(client: AsyncClient) -> str:
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _create_quest_with_xp(client: AsyncClient, token: str, *, xp_reward: int) -> tuple[str, int]:
    quests_resp = await client.get(
        "/api/v1/admin/quests",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert quests_resp.status_code == 200, quests_resp.text
    quests = quests_resp.json()
    min_rank = min((int(q["order_rank"]) for q in quests), default=1)

    create_resp = await client.post(
        "/api/v1/admin/quests",
        json={
            "title": "XP Reward Quest",
            "description": "Quest used to verify custom XP rewards.",
            "level": 1,
            "order_rank": min_rank - 1,
            "xp_reward": xp_reward,
            "initial_code": "print(4)",
            "solution_code": "print(5)",
            "explanation": "Print the expected value.",
            "tags": ["xp", "test"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_resp.status_code == 201, create_resp.text
    quest = create_resp.json()

    testcase_resp = await client.post(
        f"/api/v1/admin/quests/{quest['id']}/testcases",
        json={"input_data": {}, "expected_output": "5", "is_hidden": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert testcase_resp.status_code == 201, testcase_resp.text
    return str(quest["id"]), xp_reward


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
async def test_custom_quest_xp_and_first_fix_achievement_are_added(client: AsyncClient) -> None:
    """First completion should add the quest XP reward and the first achievement XP."""
    admin_token = await _admin_token(client)
    quest_id, xp_reward = await _create_quest_with_xp(client, admin_token, xp_reward=25)

    learner_token = await _register_and_login_fresh_learner(client)
    submit = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "print(5)"},
        headers={"Authorization": f"Bearer {learner_token}"},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["passed"] is True

    progress = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {learner_token}"},
    )
    assert progress.status_code == 200, progress.text
    body = progress.json()
    assert body["total_points"] == xp_reward + 50 + 150


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


@pytest.mark.asyncio
async def test_submit_system_busy_on_sandbox_error(client: AsyncClient) -> None:
    """When sandbox fails, returns 503 System Busy (NFR-01.3)."""
    token = await _login_learner(client)
    quest = await _get_first_quest(client, token)
    quest_id = quest["id"]

    with patch("app.api.quests.run_python", side_effect=OSError("sandbox unavailable")):
        resp = await client.post(
            f"/api/v1/quests/{quest_id}/submit",
            json={"code": "print(1)"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 503, f"Expected 503 (System Busy), got {resp.status_code}: {resp.text}"
    body = resp.json()
    assert "detail" in body
    assert "system busy" in body["detail"].lower()
