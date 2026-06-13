import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db, Base, get_db
from src.main import app
from src.routers.giving_events import router as giving_router
from src.models.giving_event import GivingEvent, GivingFlowState
from src.models.continuity_event_model import ContinuityEvent
from src.domain.stewardship_giving_rules import validate_giving_payload

# Register router for tests if not already loaded by main.py
route_paths = [route.path for route in app.routes]
if "/api/v1/giving-events/pledge-demo" not in route_paths:
    app.include_router(giving_router)

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
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.clear()

def test_giving_flow_states_and_continuity_events():
    payload = {
        "business_owner_id": "owner-123",
        "amount": "1000.00",
        "currency": "ZAR",
        "purpose": "community_support",
        "giver_reference": "Good Samaritan"
    }
    response = client.post("/api/v1/giving-events/pledge-demo", json=payload)
    assert response.status_code == 200
    giving_id = response.json()["id"]

    response = client.post(f"/api/v1/giving-events/{giving_id}/receive-demo")
    assert response.status_code == 200
    assert response.json()["state"] == "received_demo"

    response = client.post(f"/api/v1/giving-events/{giving_id}/allocate")
    assert response.status_code == 200
    assert response.json()["state"] == "allocated"

    response = client.post(f"/api/v1/giving-events/{giving_id}/mark-used")
    assert response.status_code == 200
    assert response.json()["state"] == "used"

    db = TestingSessionLocal()
    try:
        events = db.query(ContinuityEvent).order_by(ContinuityEvent.lineage_sequence.asc()).all()
        event_types = [e.event_type for e in events if e.related_entity_type == "giving_event"]
        assert event_types == [
            "giving_pledged_demo",
            "giving_received_demo",
            "giving_allocated",
            "giving_used"
        ]
    finally:
        db.close()

def test_stewardship_replay():
    payload = {
        "business_owner_id": "owner-123",
        "amount": "500.00",
        "currency": "ZAR",
        "purpose": "infrastructure",
    }
    r1 = client.post("/api/v1/giving-events/pledge-demo", json=payload)
    r2 = client.post("/api/v1/giving-events/pledge-demo", json=payload)

    client.post(f"/api/v1/giving-events/{r1.json()['id']}/receive-demo")

    replay = client.get("/api/v1/giving-events/business/owner-123/stewardship-replay")
    assert replay.status_code == 200
    data = replay.json()
    assert data["total_pledged"] == "500.00"
    assert data["total_received"] == "500.00"
    assert len(data["events"]) == 2

def test_invalid_giving_payload_pressure():
    with pytest.raises(ValueError, match="No urgency manipulation or emotional pressure allowed."):
        validate_giving_payload({"purpose": "infrastructure", "urgency": "high"})

def test_invalid_giving_payload_ranking():
    with pytest.raises(ValueError, match="Giving must not create public giver ranking."):
        validate_giving_payload({"purpose": "education", "top_donor": True})
