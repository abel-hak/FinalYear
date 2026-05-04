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


async def _admin_token(client: AsyncClient) -> str:
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


async def _create_quest_with_xp(client: AsyncClient, token: str, *, xp_reward: int) -> str:
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
            "title": "Leaderboard XP Quest",
            "description": "Quest used to verify XP-based leaderboard scoring.",
            "level": 1,
            "order_rank": min_rank - 1,
            "xp_reward": xp_reward,
            "initial_code": "print(4)",
            "solution_code": "print(5)",
            "explanation": "Print the expected value.",
            "tags": ["leaderboard", "xp"],
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
    return str(quest["id"])


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


@pytest.mark.asyncio
async def test_leaderboard_weekly_monthly_and_lifetime_use_raw_xp(client: AsyncClient) -> None:
    """Leaderboard windows should use XP values directly, with a separate lifetime view."""
    admin_token = await _admin_token(client)
    quest_id = await _create_quest_with_xp(client, admin_token, xp_reward=25)

    token, username = await _register_and_login_fresh_learner(client, "xp_rank")
    submit = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": "print(5)"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["passed"] is True

    weekly_resp = await client.get(
        "/api/v1/leaderboard?period=weekly&limit=50",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert weekly_resp.status_code == 200, weekly_resp.text
    weekly_body = weekly_resp.json()
    assert weekly_body["me"]["username"] == username
    assert weekly_body["me"]["total_points"] == 25

    monthly_resp = await client.get(
        "/api/v1/leaderboard?period=monthly&limit=50",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert monthly_resp.status_code == 200, monthly_resp.text
    monthly_body = monthly_resp.json()
    assert monthly_body["me"]["total_points"] == 25

    lifetime_resp = await client.get(
        "/api/v1/leaderboard?period=lifetime&limit=50",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert lifetime_resp.status_code == 200, lifetime_resp.text
    lifetime_body = lifetime_resp.json()
    assert lifetime_body["me"]["total_points"] == 225
