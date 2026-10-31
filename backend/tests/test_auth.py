import pytest


def test_register_and_login(client):
    reg_data = {
        "name": "Simran Kaur",
        "email": "simran.kaur@example.com",
        "password": "Password123!",
        "preferred_language": "pa"
    }
    res = client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "simran.kaur@example.com"
    assert data["role"] == "citizen"

    # Test login with same credentials
    login_data = {
        "email": "simran.kaur@example.com",
        "password": "Password123!"
    }
    res_login = client.post("/api/auth/login", json=login_data)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]

    # Test /api/auth/me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me = res_me.json()
    assert me["email"] == "simran.kaur@example.com"
    assert me["name"] == "Simran Kaur"


def test_duplicate_registration_fails(client):
    reg_data = {
        "name": "Duplicate User",
        "email": "duplicate@example.com",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=reg_data)
    assert res1.status_code == 200

    res2 = client.post("/api/auth/register", json=reg_data)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_invalid_login_credentials(client):
    res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
    assert res.status_code == 401
