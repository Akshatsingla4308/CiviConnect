from app.database import get_database_status, normalize_database_url, mask_database_url


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


def test_normalize_database_url():
    # Cloud provider (Render/Heroku) legacy prefix
    assert normalize_database_url("postgres://u:p@host:5432/db") == "postgresql+psycopg://u:p@host:5432/db"
    # Bare postgresql URL normalized to Psycopg 3
    assert normalize_database_url("postgresql://u:p@host:5432/db") == "postgresql+psycopg://u:p@host:5432/db"
    # Explicit drivers preserved
    assert normalize_database_url("postgresql+psycopg2://u:p@host:5432/db") == "postgresql+psycopg2://u:p@host:5432/db"
    assert normalize_database_url("postgresql+psycopg://u:p@host:5432/db") == "postgresql+psycopg://u:p@host:5432/db"
    assert normalize_database_url("sqlite:///./civiconnect.db") == "sqlite:///./civiconnect.db"


def test_mask_database_url():
    masked = mask_database_url("postgresql+psycopg://postgres:SecretPassword123@localhost:5432/civiconnect_db")
    assert "SecretPassword123" not in masked
    assert "***:***@" in masked


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
        # Verify psycopg2 connection
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            val = conn.execute(text("SELECT 1")).scalar()
            assert val == 1
        
        # Verify psycopg (Psycopg 3) connection
        psycopg3_url = normalize_database_url(
            settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://")
        )
        engine3 = create_engine(psycopg3_url)
        with engine3.connect() as conn:
            val3 = conn.execute(text("SELECT 1")).scalar()
            assert val3 == 1


