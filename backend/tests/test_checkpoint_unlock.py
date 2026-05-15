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


async def _login_learner(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_checkpoint_unlocks_path(client: AsyncClient) -> None:
    # Admin picks an existing quest and creates a level-2 path with it as checkpoint
    admin_token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {admin_token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quests = quests_resp.json()
    assert quests, "Expected at least one quest for checkpoint test"
    quest = quests[0]
    quest_id = quest["id"]
    solution_code = quest.get("solution_code")
    assert solution_code, "Quest must have solution code for test"

    create_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Checkpoint Test Path",
            "description": "Path with checkpoint",
            "level": 2,
            "order_rank": 999,
            "checkpoint_quest_id": quest_id,
        },
        headers=headers,
    )
    assert create_path_resp.status_code == 201, create_path_resp.text
    path_id = create_path_resp.json()["id"]

    # Learner should see the path as locked and receive checkpoint info
    token = await _login_learner(client)
    learner_headers = {"Authorization": f"Bearer {token}"}

    detail = await client.get(f"/api/v1/learning-paths/{path_id}", headers=learner_headers)
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["is_unlocked"] is False
    assert body.get("checkpoint_quest_info"), "Expected checkpoint_quest_info in response"

    # Submit correct solution for checkpoint quest
    submit_resp = await client.post(
        f"/api/v1/quests/{quest_id}/submit",
        json={"code": solution_code},
        headers=learner_headers,
    )
    assert submit_resp.status_code == 200, submit_resp.text
    sub = submit_resp.json()
    assert sub["passed"] is True

    # After passing, the path should be unlocked for learner
    detail_after = await client.get(f"/api/v1/learning-paths/{path_id}", headers=learner_headers)
    assert detail_after.status_code == 200, detail_after.text
    assert detail_after.json()["is_unlocked"] is True
