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


def test_weak_password_registration_rejected(client):
    # Too short (< 8 chars)
    res_short = client.post("/api/auth/register", json={
        "name": "Weak User",
        "email": "weak1@example.com",
        "password": "short"
    })
    assert res_short.status_code == 422

    # Only digits
    res_digits = client.post("/api/auth/register", json={
        "name": "Weak User",
        "email": "weak2@example.com",
        "password": "12345678"
    })
    assert res_digits.status_code == 422

    # Only letters
    res_letters = client.post("/api/auth/register", json={
        "name": "Weak User",
        "email": "weak3@example.com",
        "password": "abcdefgh"
    })
    assert res_letters.status_code == 422


def test_invalid_bearer_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res.status_code == 401
    assert "Invalid authentication token" in res.json()["detail"]


def test_cors_origin_allowed(client):
    res = client.options(
        "/api/schemes",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res.status_code in (200, 204)
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Production Vercel origin
    res_prod = client.options(
        "/api/schemes",
        headers={
            "Origin": "https://civi-connect-seven.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res_prod.status_code in (200, 204)
    assert res_prod.headers.get("access-control-allow-origin") == "https://civi-connect-seven.vercel.app"

    # Preview Vercel branch origin
    res_preview = client.options(
        "/api/schemes",
        headers={
            "Origin": "https://civi-connect-preview-123.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res_preview.status_code in (200, 204)
    assert res_preview.headers.get("access-control-allow-origin") == "https://civi-connect-preview-123.vercel.app"

    # Disallowed external origin
    res_disallowed = client.options(
        "/api/schemes",
        headers={
            "Origin": "https://unauthorized-external-domain.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res_disallowed.headers.get("access-control-allow-origin") is None

