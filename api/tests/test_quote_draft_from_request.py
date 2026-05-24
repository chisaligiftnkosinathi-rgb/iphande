from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.models.quote import Quote, QuoteStatus


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


def test_quote_can_be_drafted_from_quote_request_with_replay_linkage():
    quote_request = create_quote_request()

    response = client.post(
        f"/api/v1/quote-requests/{quote_request['id']}/quotes",
        json={
            "amount": "450.00",
            "currency": "ZAR",
            "service_description": "Hair styling and nails package",
            "terms": "Valid for 7 days. Booking depends on availability.",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["customer_request_id"] == quote_request["id"]
    assert body["business_owner_id"] == "BO004"
    assert body["customer_name"] == "Naledi"
    assert body["description"] == "Hair styling and nails package"
    assert body["amount"] == "450.00"
    assert body["currency"] == "ZAR"
    assert body["terms"] == "Valid for 7 days. Booking depends on availability."
    assert body["status"] == "quote_drafted"

    db = TestingSessionLocal()
    try:
        quote = db.query(Quote).first()
        assert quote.status == QuoteStatus.quote_drafted
        assert quote.amount == Decimal("450.00")

        events = (
            db.query(ContinuityEvent)
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        )
        assert [event.event_type for event in events] == [
            "quote_request_received",
            "quote_drafted",
        ]
        assert events[1].parent_event_id == events[0].id
        assert events[1].payload_json["quote_request_id"] == quote_request["id"]
        assert events[1].payload_json["quote_id"] == body["id"]
        assert events[1].payload_json["next_status"] == "quote_drafted"
        assert events[1].payload_json["amount"] == "450.00"
        assert events[1].payload_json["currency"] == "ZAR"
        assert events[1].payload_json["service_description"] == "Hair styling and nails package"
    finally:
        db.close()


def test_quote_request_cannot_draft_duplicate_quote():
    quote_request = create_quote_request()
    payload = {"amount": "450.00", "currency": "ZAR"}

    first_response = client.post(f"/api/v1/quote-requests/{quote_request['id']}/quotes", json=payload)
    second_response = client.post(f"/api/v1/quote-requests/{quote_request['id']}/quotes", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 409
