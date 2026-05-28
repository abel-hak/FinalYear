from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


async def _admin_token(client: AsyncClient) -> str:
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin1", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_ai_draft_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/admin/quests/ai-draft",
        json={"topic": "loops", "difficulty": 2},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_ai_draft_returns_normalized_payload(client: AsyncClient) -> None:
    token = await _admin_token(client)

    with patch("app.api.admin.generate_admin_quest_draft", new_callable=AsyncMock) as mock_draft:
        mock_draft.return_value = {
            "title": "  while loop bug  ",
            "description": " Fix loop condition ",
            "level": 10,
            "initial_code": "print('x')",
            "solution_code": "print('y')",
            "explanation": "because",
            "expected_output": "y",
            "tags": [" Loops ", "", "Debug"],
        }
        resp = await client.post(
            "/api/v1/admin/quests/ai-draft",
            json={"topic": "loops", "difficulty": 2, "bug_type": "logic"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["title"] == "while loop bug"
    assert body["description"] == "Fix loop condition"
    assert body["level"] == 3
    assert body["tags"] == ["loops", "debug"]


@pytest.mark.asyncio
async def test_admin_ai_draft_passes_requested_language(client: AsyncClient) -> None:
    token = await _admin_token(client)

    with patch("app.api.admin.generate_admin_quest_draft", new_callable=AsyncMock) as mock_draft:
        mock_draft.return_value = {
            "title": "Java loop bug",
            "description": "Fix the bug",
            "level": 2,
            "initial_code": "class Main {}",
            "solution_code": "class Main {}",
            "explanation": "Because",
            "expected_output": "10\n",
            "tags": ["java"],
        }
        resp = await client.post(
            "/api/v1/admin/quests/ai-draft",
            json={"topic": "loops", "difficulty": 2, "bug_type": "logic", "language": "java"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 200, resp.text
    mock_draft.assert_awaited_once()
    assert mock_draft.await_args.kwargs["language"] == "java"
