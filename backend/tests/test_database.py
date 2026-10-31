from app.database import get_database_status


def test_database_status_structure(client):
    res = client.get("/api/system/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    db_info = data["database"]
    assert "active_dialect" in db_info
    assert "is_connected" in db_info
    assert "setup_guide" in db_info
    assert db_info["is_connected"] is True
    assert db_info["active_dialect"] in ["sqlite", "postgresql"]


def test_states_taxonomy(client):
    res = client.get("/api/system/states")
    assert res.status_code == 200
    states = res.json()
    assert len(states) >= 10
    pb = next((s for s in states if s["code"] == "PB"), None)
    assert pb is not None
    assert "Amritsar" in pb["districts"]
    assert "Ludhiana" in pb["districts"]


def test_postgresql_direct_connection():
    from app.config import settings
    from sqlalchemy import create_engine, text
    if "postgres" in settings.DATABASE_URL.lower():
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            val = conn.execute(text("SELECT 1")).scalar()
            assert val == 1

