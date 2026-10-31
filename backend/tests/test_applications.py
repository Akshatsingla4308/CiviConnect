import pytest


def test_applications_tracker_lifecycle_and_authorization(client):
    # 1. Register User 1
    user1_res = client.post("/api/auth/register", json={
        "name": "App Tracker User 1",
        "email": "app.tracker1@example.com",
        "password": "Password123!"
    })
    token1 = user1_res.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Register User 2
    user2_res = client.post("/api/auth/register", json={
        "name": "App Tracker User 2",
        "email": "app.tracker2@example.com",
        "password": "Password123!"
    })
    token2 = user2_res.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 3. Create application for User 1
    create_res = client.post("/api/applications", json={
        "scheme_id": "pm-kisan",
        "scheme_name": "PM-KISAN Samman Nidhi",
        "status": "Draft",
        "department": "Ministry of Agriculture",
        "portal_url": "https://pmkisan.gov.in",
        "notes": "Collected land records and Aadhaar."
    }, headers=headers1)
    assert create_res.status_code == 200, create_res.text
    app_data = create_res.json()
    app_id = app_data["id"]
    assert app_data["scheme_id"] == "pm-kisan"
    assert app_data["status"] == "Draft"
    assert len(app_data["history"]) == 1

    # 4. User 1 lists applications
    list1 = client.get("/api/applications", headers=headers1)
    assert list1.status_code == 200
    assert list1.json()["total"] == 1
    assert list1.json()["items"][0]["id"] == app_id

    # 5. User 2 lists applications -> 0
    list2 = client.get("/api/applications", headers=headers2)
    assert list2.status_code == 200
    assert list2.json()["total"] == 0

    # 6. User 1 updates to "Submitted" with application number
    update_res1 = client.patch(f"/api/applications/{app_id}", json={
        "status": "Submitted",
        "application_number": "PMK-2026-PB-9912",
        "submission_date": "2026-11-01",
        "status_note": "Submitted application on PM-KISAN portal via CSC."
    }, headers=headers1)
    assert update_res1.status_code == 200
    updated_data = update_res1.json()
    assert updated_data["status"] == "Submitted"
    assert updated_data["application_number"] == "PMK-2026-PB-9912"
    assert len(updated_data["history"]) == 2

    # 7. Update to "Approved"
    update_res2 = client.patch(f"/api/applications/{app_id}", json={
        "status": "Approved",
        "status_note": "Verified by District Agriculture Officer."
    }, headers=headers1)
    assert update_res2.status_code == 200
    assert update_res2.json()["status"] == "Approved"
    assert len(update_res2.json()["history"]) == 3

    # 8. Cross-User Authorization: User 2 tries to view User 1's app -> 404
    get_unauth = client.get(f"/api/applications/{app_id}", headers=headers2)
    assert get_unauth.status_code == 404

    # 9. Cross-User Authorization: User 2 tries to update User 1's app -> 404
    patch_unauth = client.patch(f"/api/applications/{app_id}", json={"status": "Rejected"}, headers=headers2)
    assert patch_unauth.status_code == 404

    # 10. Cross-User Authorization: User 2 tries to delete User 1's app -> 404
    del_unauth = client.delete(f"/api/applications/{app_id}", headers=headers2)
    assert del_unauth.status_code == 404

    # 11. User 1 deletes application
    del_res = client.delete(f"/api/applications/{app_id}", headers=headers1)
    assert del_res.status_code == 200

    # 12. Verify deleted
    list_after = client.get("/api/applications", headers=headers1)
    assert list_after.json()["total"] == 0
