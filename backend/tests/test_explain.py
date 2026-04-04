"""Explain failure endpoint integration tests."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


async def _login_learner(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


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
async def test_explain_failure_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/ai/explain-failure",
        json={
            "quest_id": "00000000-0000-0000-0000-000000000001",
            "code": "print(1)",
            "expected_output": "2",
            "actual_output": "1",
            "stderr": "",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_explain_failure_returns_normalized_payload(client: AsyncClient) -> None:
    token = await _login_learner(client)
    quest_id = await _get_first_quest_id(client, token)

    with patch("app.api.explain.generate_failure_explanation", new_callable=AsyncMock) as mock_explain:
        mock_explain.return_value = {
            "what_it_does": "prints the wrong value",
            "why_wrong": "off by one",
            "next_action": "check your arithmetic",
        }
        resp = await client.post(
            "/api/v1/ai/explain-failure",
            json={
                "quest_id": quest_id,
                "code": "x=5\nprint(x+3)",
                "expected_output": "10",
                "actual_output": "8",
                "stderr": "",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["what_it_does"]
    assert body["why_wrong"]
    assert body["next_action"]
