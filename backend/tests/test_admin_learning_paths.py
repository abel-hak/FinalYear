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
async def test_admin_learning_path_crud_flow(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Admin Path Test",
            "description": "Path created from admin endpoint test.",
            "level": 1,
            "order_rank": 777,
        },
        headers=headers,
    )
    assert create_resp.status_code == 201, create_resp.text
    created = create_resp.json()
    path_id = created["id"]

    list_resp = await client.get("/api/v1/admin/learning-paths", headers=headers)
    assert list_resp.status_code == 200, list_resp.text
    listed_ids = [item["id"] for item in list_resp.json()]
    assert path_id in listed_ids

    update_resp = await client.put(
        f"/api/v1/admin/learning-paths/{path_id}",
        json={"title": "Admin Path Test Updated"},
        headers=headers,
    )
    assert update_resp.status_code == 200, update_resp.text
    updated = update_resp.json()
    assert updated["title"] == "Admin Path Test Updated"

    delete_resp = await client.delete(f"/api/v1/admin/learning-paths/{path_id}", headers=headers)
    assert delete_resp.status_code == 204, delete_resp.text


@pytest.mark.asyncio
async def test_admin_add_and_remove_quest_from_learning_path(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quests = quests_resp.json()
    assert quests, "Expected at least one quest for assignment test"
    quest_id = quests[0]["id"]

    create_path_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Assignment Test Path",
            "description": "Used to test add/remove quest in path.",
            "level": 1,
            "order_rank": 778,
        },
        headers=headers,
    )
    assert create_path_resp.status_code == 201, create_path_resp.text
    path_id = create_path_resp.json()["id"]

    add_resp = await client.post(
        f"/api/v1/admin/learning-paths/{path_id}/quests",
        json={"quest_id": quest_id},
        headers=headers,
    )
    assert add_resp.status_code == 201, add_resp.text
    added = add_resp.json()
    assert added["quest_id"] == quest_id

    list_path_quests = await client.get(
        f"/api/v1/admin/learning-paths/{path_id}/quests",
        headers=headers,
    )
    assert list_path_quests.status_code == 200, list_path_quests.text
    assigned_quest_ids = [item["quest_id"] for item in list_path_quests.json()]
    assert quest_id in assigned_quest_ids

    remove_resp = await client.delete(
        f"/api/v1/admin/learning-paths/{path_id}/quests/{quest_id}",
        headers=headers,
    )
    assert remove_resp.status_code == 204, remove_resp.text

    cleanup_resp = await client.delete(f"/api/v1/admin/learning-paths/{path_id}", headers=headers)
    assert cleanup_resp.status_code == 204, cleanup_resp.text
