from app.config import settings


def test_admin_stats_unauthorized(client):
    res = client.get("/api/admin/stats")
    assert res.status_code == 401


def test_admin_stats_and_verification_toggle(client):
    # Login as default admin
    login_res = client.post("/api/auth/login", json={
        "email": settings.ADMIN_DEFAULT_EMAIL,
        "password": settings.ADMIN_DEFAULT_PASSWORD
    })
    assert login_res.status_code == 200, login_res.text
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check stats
    stats_res = client.get("/api/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["overview"]["total_schemes"] >= 50
    assert stats["overview"]["verified_schemes"] >= 50

    # Toggle verification status
    toggle_res = client.put(
        "/api/admin/schemes/pm-kisan/verification",
        json={"status": "partially_verified"},
        headers=headers
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["verification_status"] == "partially_verified"

    # Verify audit log recorded
    logs_res = client.get("/api/admin/audit-logs", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) > 0
    assert any(l["target_id"] == "pm-kisan" for l in logs)

    # Revert back to verified
    client.put(
        "/api/admin/schemes/pm-kisan/verification",
        json={"status": "verified"},
        headers=headers
    )
