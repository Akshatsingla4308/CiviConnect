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
        def dynamic_mock(contents=None, **kwargs):
            mock_res = MagicMock()
            txt = "Mocked response from CiviConnect assistant based on verified schemes."
            prompt_str = str(contents or "")
            query_part = prompt_str.split("USER QUERY:")[-1].lower() if "USER QUERY:" in prompt_str else prompt_str.lower()
            if "bank" in query_part or "account" in query_part or "khata" in query_part:
                txt = "### प्रधानमंत्री जन धन योजना (PMJDY)\nआप Zero Balance खाता खोल सकते हैं। आवश्यक दस्तावेज: आधार कार्ड।"
            elif "doctor" in query_part or "daughter" in query_part or "sukanya" in query_part:
                txt = "### Sukanya Samriddhi Yojana (SSY)\nAs a government doctor, you are excluded from BPL programs, but you can open accounts for your daughters under Sukanya Samriddhi Yojana."
            mock_res.text = txt
            return mock_res

        monkeypatch.setattr(assistant_service.client.models, "generate_content", dynamic_mock)
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
