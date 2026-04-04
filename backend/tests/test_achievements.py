"""Achievements integration tests."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


async def _register_and_login_fresh_learner(client: AsyncClient) -> tuple[str, str]:
    uid = str(uuid.uuid4())[:8]
    username = f"achtest_{uid}"
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": f"{username}@test.dev",
            "password": "test123",
            "role": "learner",
        },
    )
    assert resp.status_code == 201, resp.text

    login = await client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": "test123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"], username


async def _get_first_quest_id(client: AsyncClient, token: str) -> str:
    progress = await client.get(
        "/api/v1/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200, progress.text
    quests = progress.json().get("quests", [])
    assert quests, "Need at least one quest"
    return str(quests[0]["id"])


def _by_id(items: list[dict], ach_id: str) -> dict:
    found = next((i for i in items if i["id"] == ach_id), None)
    assert found is not None, f"Missing achievement id={ach_id}"
    return found


@pytest.mark.asyncio
async def test_achievements_unlock_first_fix_after_first_pass(client: AsyncClient) -> None:
    """Passing first quest should unlock first_fix and keep ai_hint_first locked."""
    token, _ = await _register_and_login_fresh_learner(client)
    quest_id = await _get_first_quest_id(client, token)

    submit = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "x = 7\nprint(x + 3)"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["passed"] is True

    ach_resp = await client.get(
        "/api/v1/achievements",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ach_resp.status_code == 200, ach_resp.text
    items = ach_resp.json()

    first_fix = _by_id(items, "first_fix")
    ai_hint_first = _by_id(items, "ai_hint_first")

    assert first_fix["unlocked"] is True
    assert first_fix["progress"]["current"] >= 1
    assert ai_hint_first["unlocked"] is False


@pytest.mark.asyncio
async def test_achievements_unlock_ai_hint_first_after_hint_usage(client: AsyncClient) -> None:
    """Requesting one hint should unlock ai_hint_first achievement."""
    token, _ = await _register_and_login_fresh_learner(client)
    quest_id = await _get_first_quest_id(client, token)

    with patch("app.api.hints.generate_hint", new_callable=AsyncMock) as mock_hint:
        mock_hint.return_value = "Try checking the variable assignment."
        hint_resp = await client.post(
            "/api/v1/hints/ai",
            json={"quest_id": quest_id, "code": "x = 5", "last_output": None},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert hint_resp.status_code == 200, hint_resp.text

    ach_resp = await client.get(
        "/api/v1/achievements",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ach_resp.status_code == 200, ach_resp.text
    items = ach_resp.json()

    ai_hint_first = _by_id(items, "ai_hint_first")
    assert ai_hint_first["unlocked"] is True
    assert ai_hint_first["progress"]["current"] >= 1
