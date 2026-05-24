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


def create_sent_quote():
    request_response = client.post(
        "/api/v1/quote-requests",
        json={
            "business_owner_id": "BO004",
            "business_category_key": "beauty_and_hair",
            "business_line": "Beauty Salon",
            "customer_name": "Thandi",
            "customer_phone": "0720000000",
            "service_needed": "Wash, treatment, and nails",
        },
    )
    assert request_response.status_code == 200
    quote_request_id = request_response.json()["id"]

    quote_response = client.post(
        f"/api/v1/quote-requests/{quote_request_id}/quotes",
        json={
            "amount": "520.00",
            "currency": "ZAR",
            "service_description": "Wash, treatment, and nails package",
            "terms": "Valid for 7 days.",
        },
    )
    assert quote_response.status_code == 200
    quote_id = quote_response.json()["id"]

    send_response = client.post(f"/api/v1/quotes/{quote_id}/send")
    assert send_response.status_code == 200
    assert send_response.json()["status"] == "quote_sent"
    return send_response.json()


def get_payment_events(payment_id: str):
    db = TestingSessionLocal()
    try:
        return (
            db.query(ContinuityEvent)
            .filter(
                ContinuityEvent.related_entity_type == "payment_intent",
                ContinuityEvent.related_entity_id == payment_id,
            )
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        )
    finally:
        db.close()


def test_payment_evidence_requires_steward_verification_before_receipt():
    quote = create_sent_quote()

    intent_response = client.post(
        f"/api/v1/quotes/{quote['id']}/payment-intents",
        json={"provider_name": "manual_evidence", "payer_reference": "Thandi"},
    )
    assert intent_response.status_code == 200
    payment = intent_response.json()
    assert payment["status"] == "evidence_awaiting"
    payment_id = payment["id"]

    early_receipt_response = client.post(f"/api/v1/payments/intents/{payment_id}/receipt")
    assert early_receipt_response.status_code == 409
    assert early_receipt_response.json()["detail"] == "Receipt requires verified payment"

    proof_response = client.post(
        f"/api/v1/payments/intents/{payment_id}/proofs",
        json={
            "file_name": "proof.pdf",
            "file_type": "application/pdf",
            "uploaded_by": "customer",
            "extracted_amount": "520.00",
            "extracted_reference": payment["payment_reference"],
            "payer_name": "Thandi",
            "account_info_present": True,
            "notes": "Customer uploaded bank proof.",
        },
    )
    assert proof_response.status_code == 200
    assert proof_response.json()["evidence_status"] == "evidence_check_passed"

    verify_response = client.post(f"/api/v1/payments/intents/{payment_id}/verify")
    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "verified"

    receipt_response = client.post(f"/api/v1/payments/intents/{payment_id}/receipt")
    assert receipt_response.status_code == 200
    assert receipt_response.json()["receipt_number"].startswith("RCPT-")

    events = get_payment_events(payment_id)
    assert [event.event_type for event in events] == [
        "payment_intent_created",
        "payment_under_review",
        "payment_verified",
        "receipt_issued",
    ]
    assert events[2].payload_json["next_status"] == "verified"


def test_evidence_check_failure_still_only_moves_payment_under_review():
    quote = create_sent_quote()
    intent = client.post(f"/api/v1/quotes/{quote['id']}/payment-intents", json={}).json()

    proof_response = client.post(
        f"/api/v1/payments/intents/{intent['id']}/proofs",
        json={
            "file_name": "screenshot.png",
            "file_type": "image/png",
            "uploaded_by": "customer",
            "extracted_amount": "100.00",
            "account_info_present": False,
        },
    )

    assert proof_response.status_code == 200
    assert proof_response.json()["evidence_status"] == "evidence_check_failed"
    events = get_payment_events(intent["id"])
    assert [event.event_type for event in events] == [
        "payment_intent_created",
        "payment_under_review",
    ]

    db = TestingSessionLocal()
    try:
        proof_events = (
            db.query(ContinuityEvent)
            .filter(ContinuityEvent.related_entity_type == "proof_of_payment")
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        )
        assert [event.event_type for event in proof_events] == [
            "payment_evidence_submitted",
            "evidence_check_failed",
        ]
        assert proof_events[1].payload_json["truth_boundary"] == "Evidence check is not payment verification."
    finally:
        db.close()
