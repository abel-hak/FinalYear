from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

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
async def test_admin_self_assigns_as_creator_and_manages_assigned_path(client: AsyncClient) -> None:
    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        "/api/v1/admin/learning-paths",
        json={
            "title": "Creator Self Assignment Path",
            "description": "Path managed by the admin after self assignment.",
            "level": 1,
            "order_rank": 880,
            "creator_email": "admin@codequest.dev",
        },
        headers=headers,
    )
    assert create_resp.status_code == 201, create_resp.text
    path_id = create_resp.json()["id"]

    creator_paths_resp = await client.get("/api/v1/creator/learning-paths", headers=headers)
    assert creator_paths_resp.status_code == 200, creator_paths_resp.text
    creator_path_ids = {item["id"] for item in creator_paths_resp.json()}
    assert path_id in creator_path_ids

    quests_resp = await client.get("/api/v1/admin/quests", headers=headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quest_id = quests_resp.json()[0]["id"]

    add_resp = await client.post(
        f"/api/v1/creator/learning-paths/{path_id}/quests",
        json={"quest_id": quest_id},
        headers=headers,
    )
    assert add_resp.status_code == 201, add_resp.text
    assert add_resp.json()["quest_id"] == quest_id

    list_resp = await client.get(f"/api/v1/creator/learning-paths/{path_id}/quests", headers=headers)
    assert list_resp.status_code == 200, list_resp.text
    assert quest_id in {item["quest_id"] for item in list_resp.json()}

    remove_resp = await client.delete(
        f"/api/v1/creator/learning-paths/{path_id}/quests/{quest_id}",
        headers=headers,
    )
    assert remove_resp.status_code == 204, remove_resp.text


@pytest.mark.asyncio
async def test_admin_invites_creator_and_creator_accepts_invitation(client: AsyncClient) -> None:
    admin_token = await _admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    captured: dict[str, str] = {}

    async def fake_send_creator_invitation_email(*args, **kwargs) -> None:
        captured["accept_url"] = kwargs["accept_url"]

    with patch(
        "app.services.email_service.SmtpEmailService.send_creator_invitation_email",
        new_callable=AsyncMock,
    ) as mock_send:
        mock_send.side_effect = fake_send_creator_invitation_email
        create_resp = await client.post(
            "/api/v1/admin/learning-paths",
            json={
                "title": "Creator Invite Path",
                "description": "Path managed by an invited creator.",
                "level": 1,
                "order_rank": 881,
                "creator_email": "learner@codequest.dev",
            },
            headers=admin_headers,
        )

    assert create_resp.status_code == 201, create_resp.text
    accept_url = captured.get("accept_url")
    assert accept_url
    token = parse_qs(urlparse(accept_url).query)["token"][0]

    learner_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert learner_login.status_code == 200, learner_login.text
    learner_token = learner_login.json()["access_token"]
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    accept_resp = await client.post(
        "/api/v1/creator/invitations/accept",
        json={"token": token},
        headers=learner_headers,
    )
    assert accept_resp.status_code == 200, accept_resp.text

    creator_paths_resp = await client.get("/api/v1/creator/learning-paths", headers=learner_headers)
    assert creator_paths_resp.status_code == 200, creator_paths_resp.text
    creator_path_ids = {item["id"] for item in creator_paths_resp.json()}
    path_id = create_resp.json()["id"]
    assert path_id in creator_path_ids

    quests_resp = await client.get("/api/v1/admin/quests", headers=admin_headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quest_id = quests_resp.json()[0]["id"]

    add_resp = await client.post(
        f"/api/v1/creator/learning-paths/{path_id}/quests",
        json={"quest_id": quest_id},
        headers=learner_headers,
    )
    assert add_resp.status_code == 201, add_resp.text

    remove_resp = await client.delete(
        f"/api/v1/creator/learning-paths/{path_id}/quests/{quest_id}",
        headers=learner_headers,
    )
    assert remove_resp.status_code == 204, remove_resp.text


@pytest.mark.asyncio
async def test_admin_reinvites_pending_creator_path_replaces_invitation(client: AsyncClient) -> None:
    admin_token = await _admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    captured_accept_urls: list[str] = []

    async def fake_send_creator_invitation_email(*args, **kwargs) -> None:
        captured_accept_urls.append(kwargs["accept_url"])

    with patch(
        "app.services.email_service.SmtpEmailService.send_creator_invitation_email",
        new_callable=AsyncMock,
    ) as mock_send:
        mock_send.side_effect = fake_send_creator_invitation_email

        create_resp = await client.post(
            "/api/v1/admin/learning-paths",
            json={
                "title": "Reinvite Pending Path",
                "description": "Path used to verify creator invite replacement.",
                "level": 1,
                "order_rank": 883,
            },
            headers=admin_headers,
        )
        assert create_resp.status_code == 201, create_resp.text
        path_id = create_resp.json()["id"]

        first_update_resp = await client.put(
            f"/api/v1/admin/learning-paths/{path_id}",
            json={"creator_email": "learner@codequest.dev"},
            headers=admin_headers,
        )
        assert first_update_resp.status_code == 200, first_update_resp.text

        second_update_resp = await client.put(
            f"/api/v1/admin/learning-paths/{path_id}",
            json={"creator_email": "learner@codequest.dev"},
            headers=admin_headers,
        )
        assert second_update_resp.status_code == 200, second_update_resp.text

    assert len(captured_accept_urls) == 2
    first_token = parse_qs(urlparse(captured_accept_urls[0]).query)["token"][0]
    second_token = parse_qs(urlparse(captured_accept_urls[1]).query)["token"][0]
    assert first_token != second_token

    learner_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert learner_login.status_code == 200, learner_login.text
    learner_token = learner_login.json()["access_token"]
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    old_accept_resp = await client.post(
        "/api/v1/creator/invitations/accept",
        json={"token": first_token},
        headers=learner_headers,
    )
    assert old_accept_resp.status_code == 404, old_accept_resp.text

    new_accept_resp = await client.post(
        "/api/v1/creator/invitations/accept",
        json={"token": second_token},
        headers=learner_headers,
    )
    assert new_accept_resp.status_code == 200, new_accept_resp.text


@pytest.mark.asyncio
async def test_creator_can_edit_quest_in_assigned_path(client: AsyncClient) -> None:
    admin_token = await _admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    captured: dict[str, str] = {}

    async def fake_send_creator_invitation_email(*args, **kwargs) -> None:
        captured["accept_url"] = kwargs["accept_url"]

    with patch(
        "app.services.email_service.SmtpEmailService.send_creator_invitation_email",
        new_callable=AsyncMock,
    ) as mock_send:
        mock_send.side_effect = fake_send_creator_invitation_email
        create_resp = await client.post(
            "/api/v1/admin/learning-paths",
            json={
                "title": "Editable Creator Path",
                "description": "Path used to verify creator quest editing.",
                "level": 1,
                "order_rank": 882,
                "creator_email": "learner@codequest.dev",
            },
            headers=admin_headers,
        )

    assert create_resp.status_code == 201, create_resp.text
    accept_url = captured.get("accept_url")
    assert accept_url
    token = parse_qs(urlparse(accept_url).query)["token"][0]
    path_id = create_resp.json()["id"]

    learner_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "learner1", "password": "learner123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert learner_login.status_code == 200, learner_login.text
    learner_token = learner_login.json()["access_token"]
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    accept_resp = await client.post(
        "/api/v1/creator/invitations/accept",
        json={"token": token},
        headers=learner_headers,
    )
    assert accept_resp.status_code == 200, accept_resp.text

    quests_resp = await client.get("/api/v1/admin/quests", headers=admin_headers)
    assert quests_resp.status_code == 200, quests_resp.text
    quest_id = quests_resp.json()[0]["id"]

    add_resp = await client.post(
        f"/api/v1/creator/learning-paths/{path_id}/quests",
        json={"quest_id": quest_id},
        headers=learner_headers,
    )
    assert add_resp.status_code == 201, add_resp.text

    detail_resp = await client.get(
        f"/api/v1/creator/quests/{quest_id}",
        headers=learner_headers,
    )
    assert detail_resp.status_code == 200, detail_resp.text
    assert detail_resp.json()["id"] == quest_id

    edit_resp = await client.put(
        f"/api/v1/creator/quests/{quest_id}",
        json={
            "title": "Updated by creator",
            "description": "Updated description",
        },
        headers=learner_headers,
    )
    assert edit_resp.status_code == 200, edit_resp.text
    assert edit_resp.json()["title"] == "Updated by creator"

