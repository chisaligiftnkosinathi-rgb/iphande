import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent


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


def create_quote_request():
    response = client.post(
        "/api/v1/quote-requests",
        json={
            "business_owner_id": "BO004",
            "business_category_key": "beauty_and_hair",
            "business_line": "Beauty Salon",
            "post_id": "post-001",
            "customer_name": "Naledi",
            "customer_phone": "0710000000",
            "customer_location": "Pretoria",
            "service_needed": "Hair styling and nails",
            "preferred_date": "2026-05-25",
            "message": "Please send available times.",
        },
    )
    assert response.status_code == 200
    return response.json()


def get_events(quote_request_id: str):
    db = TestingSessionLocal()
    try:
        return (
            db.query(ContinuityEvent)
            .filter(
                ContinuityEvent.related_entity_type == "quote_request",
                ContinuityEvent.related_entity_id == quote_request_id,
            )
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        )
    finally:
        db.close()


def test_quote_request_creation_emits_customer_continuity_event():
    quote_request = create_quote_request()

    assert quote_request["status"] == "quote_requested"
    events = get_events(quote_request["id"])
    assert [event.event_type for event in events] == ["quote_request_received"]
    assert events[0].actor_type == "customer"
    assert events[0].payload_json["customer_name"] == "Naledi"
    assert events[0].payload_json["post_id"] == "post-001"


def test_quote_request_lifecycle_transitions_are_replay_visible_and_parent_linked():
    quote_request = create_quote_request()
    quote_request_id = quote_request["id"]

    for action, expected_status in [
        ("review", "quote_reviewed"),
        ("contact", "quote_contacted"),
        ("convert", "quote_converted"),
        ("close", "quote_closed"),
    ]:
        response = client.post(f"/api/v1/quote-requests/{quote_request_id}/{action}")
        assert response.status_code == 200
        assert response.json()["status"] == expected_status

    events = get_events(quote_request_id)
    assert [event.event_type for event in events] == [
        "quote_request_received",
        "quote_request_status_updated",
        "quote_request_status_updated",
        "quote_request_status_updated",
        "quote_request_status_updated",
    ]
    assert [event.payload_json.get("next_status") for event in events[1:]] == [
        "quote_reviewed",
        "quote_contacted",
        "quote_converted",
        "quote_closed",
    ]
    for parent, child in zip(events, events[1:]):
        assert child.parent_event_id == parent.id


def test_quote_requests_can_be_filtered_for_steward_inbox():
    create_quote_request()

    response = client.get("/api/v1/quote-requests?business_owner_id=BO004&status=quote_requested")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["customer_name"] == "Naledi"
    assert body[0]["business_owner_id"] == "BO004"


def test_legacy_status_patch_aliases_to_continuity_statuses():
    quote_request = create_quote_request()

    response = client.patch(
        f"/api/v1/quote-requests/{quote_request['id']}/status",
        json={"status": "contacted"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "quote_contacted"
