"""
M6: Hint API integration tests.

Tests GET /hints/remaining and POST /hints/ai with limit enforcement.
Uses mock for AI to avoid requiring external API config.
"""
import uuid
from unittest.mock import AsyncMock, patch

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
    """Register a new learner and return token. Use for tests that need zero prior hint usage."""
    uid = str(uuid.uuid4())[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"hinttest_{uid}",
            "email": f"hinttest_{uid}@test.dev",
            "password": "test123",
            "role": "learner",
        },
    )
    assert resp.status_code == 201, resp.text
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": f"hinttest_{uid}", "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _get_quest_id_by_index(client: AsyncClient, token: str, index: int = 0) -> str:
    """Get quest ID at index from progress (use different quests per test to avoid interference)."""
    resp = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    quests = resp.json().get("quests", [])
    assert len(quests) > index, f"Need at least {index + 1} quests from seed"
    return str(quests[index]["id"])


@pytest.mark.asyncio
async def test_hint_remaining_returns_3_for_new_learner(client: AsyncClient) -> None:
    """GET /hints/remaining returns 3 when learner has not used any hints."""
    token = await _login_learner(client)
    quest_id = await _get_quest_id_by_index(client, token, 0)

    resp = await client.get(
        f"/api/v1/hints/remaining?quest_id={quest_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["remaining"] == 3


@pytest.mark.asyncio
async def test_hint_remaining_decreases_after_request(client: AsyncClient) -> None:
    """After requesting a hint, remaining count decreases."""
    token = await _register_and_login_fresh_learner(client)
    quest_id = await _get_quest_id_by_index(client, token, 0)

    with patch("app.api.hints.generate_hint", new_callable=AsyncMock) as mock_hint:
        mock_hint.return_value = "Try checking the variable assignment."

        resp = await client.post(
            "/api/v1/hints/ai",
            json={
                "quest_id": quest_id,
                "code": "x = 5\nprint(x + 3)",
                "last_output": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "hint" in body
        assert body["remaining"] == 2

    # Verify GET /remaining reflects the change
    remaining_resp = await client.get(
        f"/api/v1/hints/remaining?quest_id={quest_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert remaining_resp.status_code == 200
    assert remaining_resp.json()["remaining"] == 2


@pytest.mark.asyncio
async def test_hint_limit_enforced_after_3_requests(client: AsyncClient) -> None:
    """After 3 hint requests, POST returns 403."""
    token = await _register_and_login_fresh_learner(client)
    quest_id = await _get_quest_id_by_index(client, token, 0)

    with patch("app.api.hints.generate_hint", new_callable=AsyncMock) as mock_hint:
        mock_hint.return_value = "A helpful hint."

        for _ in range(3):
            resp = await client.post(
                "/api/v1/hints/ai",
                json={
                    "quest_id": quest_id,
                    "code": "x = 5",
                    "last_output": None,
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

        # 4th request should fail
        resp = await client.post(
            "/api/v1/hints/ai",
            json={
                "quest_id": quest_id,
                "code": "x = 5",
                "last_output": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403, resp.text
        assert "hint" in resp.json().get("detail", "").lower() or "limit" in resp.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_hint_requires_auth(client: AsyncClient) -> None:
    """Hint endpoints require valid JWT."""
    resp = await client.get(
        "/api/v1/hints/remaining?quest_id=00000000-0000-0000-0000-000000000001",
    )
    assert resp.status_code == 401

    resp = await client.post(
        "/api/v1/hints/ai",
        json={"quest_id": "00000000-0000-0000-0000-000000000001", "code": "print(1)", "last_output": None},
    )
    assert resp.status_code == 401
