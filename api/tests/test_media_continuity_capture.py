import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.auth.supabase_auth import get_current_user

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    from src.database import register_models
    register_models()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)

def test_record_evidence_returns_media():
    app.dependency_overrides[get_current_user] = lambda: {"uid": "uid-123", "email": "test@example.com"}
    payload = {
        "bucket_name": "proof-of-work",
        "public_url": "https://example.com/supabase/proof-of-work/123.jpg",
        "purpose": "Completed Job",
        "profile_id": "steward-123",
        "opportunity_id": "opp-123",
        "quote_id": None
    }
    response = client.post("/api/v1/media/evidence", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["owner_profile_id"] == "steward-123"
    assert data["file_url"] == "https://example.com/supabase/proof-of-work/123.jpg"
    assert data["media_type"] == "proof-of-work"
    app.dependency_overrides.pop(get_current_user, None)

def test_reject_unsupported_bucket():
    app.dependency_overrides[get_current_user] = lambda: {"uid": "uid-123", "email": "test@example.com"}
    payload = {
        "bucket_name": "random-bucket",
        "public_url": "https://example.com/123.jpg",
        "purpose": "Hacking",
        "profile_id": "steward-123"
    }
    response = client.post("/api/v1/media/evidence", json=payload)
    assert response.status_code == 400
    assert "Invalid bucket" in response.json()["detail"]
    app.dependency_overrides.pop(get_current_user, None)
