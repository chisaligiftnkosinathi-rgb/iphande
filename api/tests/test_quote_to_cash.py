from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db, Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.models.financial_event import FinancialEvent
from src.models.invoice import Invoice, InvoiceStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
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


def test_quote_to_cash_demo_flow_records_business_truth_states():
    quote = _create_quote()
    accepted_quote = _accept_quote(quote["id"])
    invoice = _create_invoice(quote["id"])
    payment = _create_payment_intent(invoice["id"])
    confirmed_payment = _confirm_demo_payment(payment["id"])

    assert quote["status"] == "issued"
    assert accepted_quote["status"] == "accepted"
    assert invoice["status"] == "issued"
    assert payment["status"] == "pending"
    assert confirmed_payment["status"] == "confirmed"
    assert confirmed_payment["provider_name"] == "demo"
    assert confirmed_payment["financial_event_id"]

    db = TestingSessionLocal()
    try:
        db_quote = db.query(Quote).first()
        db_invoice = db.query(Invoice).first()
        db_payment = db.query(PaymentIntent).first()
        financial_event = db.query(FinancialEvent).first()

        assert db_quote.status == QuoteStatus.accepted
        assert db_invoice.status == InvoiceStatus.paid
        assert db_payment.status == PaymentIntentStatus.confirmed
        assert financial_event.event_type.value == "income_received"
        assert financial_event.amount == Decimal("850.00")
        assert str(db_payment.financial_event_id) == str(financial_event.id)
    finally:
        db.close()


def test_quote_to_cash_appends_causal_replay_chain_without_calling_it_cash_too_early():
    quote = _create_quote()
    _accept_quote(quote["id"])
    invoice = _create_invoice(quote["id"])
    payment = _create_payment_intent(invoice["id"])

    db = TestingSessionLocal()
    try:
        event_types_before_payment = [
            event.event_type
            for event in db.query(ContinuityEvent).order_by(ContinuityEvent.lineage_sequence.asc()).all()
            if not event.event_type.startswith("state_transition_")
        ]
        assert event_types_before_payment == [
            "quote_issued",
            "quote_accepted",
            "invoice_created",
            "payment_intent_created",
        ]
        assert db.query(FinancialEvent).count() == 0
    finally:
        db.close()

    _confirm_demo_payment(payment["id"])

    db = TestingSessionLocal()
    try:
        events = db.query(ContinuityEvent).filter(~ContinuityEvent.event_type.like("state_transition_%")).order_by(ContinuityEvent.lineage_sequence.asc()).all()
        assert [event.event_type for event in events] == [
            "quote_issued",
            "quote_accepted",
            "invoice_created",
            "payment_intent_created",
            "payment_confirmed",
            "income_received",
        ]
        for parent, child in zip(events, events[1:]):
            assert child.parent_event_id == parent.id
    finally:
        db.close()


def test_confirmed_demo_payment_updates_stewardship_ledger_reports():
    quote = _create_quote()
    _accept_quote(quote["id"])
    invoice = _create_invoice(quote["id"])
    payment = _create_payment_intent(invoice["id"])
    _confirm_demo_payment(payment["id"])

    cash_replay = client.get("/api/v1/financial-events/business/test-owner-123/cash-replay")
    profit_snapshot = client.get("/api/v1/financial-events/business/test-owner-123/profit-snapshot")

    assert cash_replay.status_code == 200
    assert profit_snapshot.status_code == 200
    assert cash_replay.json()["inflow_total"] == "850.00"
    assert cash_replay.json()["net_cash"] == "850.00"
    assert profit_snapshot.json()["income_total"] == "850.00"
    assert profit_snapshot.json()["profit"] == "850.00"


def test_invoice_requires_accepted_quote():
    quote = _create_quote()

    response = client.post(f"/api/v1/invoices/from-quote/{quote['id']}")

    assert response.status_code == 409
    assert response.json()["detail"] == "Only accepted quotes can become invoices"


def _create_quote():
    response = client.post(
        "/api/v1/quotes",
        json={
            "business_owner_id": "test-owner-123",
            "customer_request_id": "request-001",
            "customer_name": "Customer A",
            "customer_phone": "+27000000000",
            "description": "Funeral cover quote",
            "amount": "850.00",
            "currency": "ZAR",
        },
    )
    assert response.status_code == 200
    return response.json()


def _accept_quote(quote_id: str):
    response = client.post(f"/api/v1/quotes/{quote_id}/accept")
    assert response.status_code == 200
    return response.json()


def _create_invoice(quote_id: str):
    response = client.post(f"/api/v1/invoices/from-quote/{quote_id}")
    assert response.status_code == 200
    return response.json()


def _create_payment_intent(invoice_id: str):
    response = client.post(
        "/api/v1/payments/intents",
        json={
            "invoice_id": invoice_id,
            "provider_name": "demo",
            "payer_reference": "customer-a",
        },
    )
    assert response.status_code == 200
    return response.json()


def _confirm_demo_payment(payment_id: str):
    response = client.post(f"/api/v1/payments/{payment_id}/confirm-demo")
    assert response.status_code == 200
    return response.json()
