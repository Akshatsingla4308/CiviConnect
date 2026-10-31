import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.services.seed_service import SeedService
from app.services.assistant_service import assistant_service
from unittest.mock import MagicMock

TEST_DATABASE_URL = "sqlite:///./test_civiconnect.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def mock_gemini_calls(monkeypatch):
    """Ensure automated tests never hang on live external Gemini network calls."""
    if assistant_service.client:
        mock_response = MagicMock()
        mock_response.text = "Mocked response from CiviConnect assistant based on verified schemes."
        monkeypatch.setattr(assistant_service.client.models, "generate_content", lambda **kwargs: mock_response)
    yield


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        SeedService.seed_all(db=db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_civiconnect.db"):
        try:
            os.remove("./test_civiconnect.db")
        except Exception:
            pass


@pytest.fixture(scope="function")
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
