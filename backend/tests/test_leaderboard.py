"""Leaderboard integration tests."""

import uuid

import pytest
from httpx import AsyncClient


async def _register_and_login_fresh_learner(client: AsyncClient, username_prefix: str) -> tuple[str, str]:
    uid = str(uuid.uuid4())[:8]
    username = f"{username_prefix}_{uid}"
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


@pytest.mark.asyncio
async def test_leaderboard_all_tie_breaks_by_username(client: AsyncClient) -> None:
    """All-time leaderboard should apply username ascending tie-break for equal scores."""
    token_a, user_a = await _register_and_login_fresh_learner(client, "aaa_rank")
    _, user_z = await _register_and_login_fresh_learner(client, "zzz_rank")

    resp = await client.get(
        "/api/v1/leaderboard?period=all&limit=50",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    entries = body.get("entries", [])
    usernames = [e["username"] for e in entries]
    assert user_a in usernames
    assert user_z in usernames
    assert usernames.index(user_a) < usernames.index(user_z)


@pytest.mark.asyncio
async def test_leaderboard_weekly_includes_recent_activity(client: AsyncClient) -> None:
    """Weekly leaderboard should include a learner after a recent passed submission."""
    token, username = await _register_and_login_fresh_learner(client, "weekly_rank")
    quest_id = await _get_first_quest_id(client, token)

    submit = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "x = 7\nprint(x + 3)"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["passed"] is True

    resp = await client.get(
        "/api/v1/leaderboard?period=weekly&limit=50",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    me = body.get("me")
    assert me is not None
    assert me["username"] == username
    assert me["total_points"] >= 10
    assert me["quests_completed"] >= 1
