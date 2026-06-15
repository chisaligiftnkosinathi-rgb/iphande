import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)

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
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

steward_id = "steward-123"


def test_create_quick_text_capture():
    payload = {
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Test quick note"
    }
    resp = client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["steward_id"] == steward_id
    assert data["source_type"] == "quick_text"
    assert data["raw_text"] == "Test quick note"
    assert data["status"] == "captured"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_payment_signal_capture_with_context_hint():
    payload = {
        "steward_id": steward_id,
        "source_type": "payment_signal",
        "context_hint": "EFT screenshot sent via WhatsApp"
    }
    resp = client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_type"] == "payment_signal"
    assert data["context_hint"] == "EFT screenshot sent via WhatsApp"


def test_reject_empty_capture_payload():
    payload = {
        "steward_id": steward_id,
        "source_type": "other"
    }
    resp = client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 422


def test_list_captures_by_steward():
    # Create two captures
    client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "First"
    })
    client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Second"
    })
    resp = client.get(f"/api/v1/continuity-captures?steward_id={steward_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for item in data:
        assert item["steward_id"] == steward_id


def test_read_capture_by_id():
    # Create a capture
    resp = client.post("/api/v1/continuity-captures", json={
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Read by id"
    })
    assert resp.status_code == 200
    capture_id = resp.json()["id"]
    # Read it
    resp2 = client.get(f"/api/v1/continuity-captures/{capture_id}")
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["id"] == capture_id
    assert data["raw_text"] == "Read by id"


def test_capture_defaults_to_captured_status():
    payload = {
        "steward_id": steward_id,
        "source_type": "quick_text",
        "raw_text": "Default status"
    }
    resp = client.post("/api/v1/continuity-captures", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "captured"
