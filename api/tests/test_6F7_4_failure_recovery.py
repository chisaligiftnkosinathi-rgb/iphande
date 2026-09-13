import pytest
import uuid
from decimal import Decimal
from unittest.mock import patch
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, IntegrityError
from fastapi.testclient import TestClient

from src.main import app
from src.database import SessionLocal, Base, engine
from src.models.profile import Profile
from src.models.quote import Quote, QuoteStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.financial_event import FinancialEvent
from src.models.continuity_event_model import ContinuityEvent


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def setup_tenants(db: Session):
    tenant_a = Profile(id="tenant_a", owner_id="tenant_a", email="a@example.com", name="A", slug="a", trust_posture="system_creator")
    db.merge(tenant_a)
    tenant_b = Profile(id="tenant_b", owner_id="tenant_b", email="b@example.com", name="B", slug="b", trust_posture="system_creator")
    db.merge(tenant_b)
    db.commit()
    return {"A": tenant_a.id, "B": tenant_b.id}


@pytest.fixture
def auth_mock():
    def override_get_current_user():
        return {"uid": "tenant_a", "email": "a@example.com"}

    import src.services.verification_service
    original_require = src.services.verification_service.require_verified_steward_or_platform_admin
    src.services.verification_service.require_verified_steward_or_platform_admin = lambda p: p

    from src.auth.supabase_auth import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)
    src.services.verification_service.require_verified_steward_or_platform_admin = original_require


def test_failure_before_commit_rolls_back(db: Session, setup_tenants, auth_mock):
    """
    Test 1 & 2: Database failure before commit / Event emission failure.
    If event emission throws an exception inside the transaction, the commercial mutation is rolled back.
    """
    tenant_id = setup_tenants["A"]
    client = TestClient(app, raise_server_exceptions=False)

    parent_event_id = uuid.uuid4()
    parent_event = ContinuityEvent(id=parent_event_id, business_owner_id=tenant_id, event_type="quote_issued")
    db.add(parent_event)

    quote = Quote(
        id=uuid.uuid4(),
        business_owner_id=tenant_id,
        status=QuoteStatus.issued,
        customer_name="Test Customer",
        customer_phone="+1234567890",
        description="Test Quote",
        amount=Decimal("150.00"),
        currency="USD",
        continuity_event_id=parent_event_id
    )
    db.add(quote)
    db.commit()

    # Mock emit_continuity_event to throw an error
    with patch("src.routers.quotes.emit_continuity_event", side_effect=RuntimeError("Simulated Event Emission Failure")):
        resp = client.post(f"/api/v1/quotes/{quote.id}/accept")
        assert resp.status_code == 500

    # Ensure Quote is still issued (rollback succeeded)
    db.refresh(quote)
    assert quote.status == QuoteStatus.issued


def test_client_timeout_idempotency_retry(db: Session, setup_tenants, auth_mock):
    """
    Test 4 & 5: Client timeout after commit / Duplicate retry.
    A retry of an already completed transaction returns the original result.
    """
    tenant_id = setup_tenants["A"]
    client = TestClient(app, raise_server_exceptions=False)

    idempotency_key = f"IDEMP-RETRY-{uuid.uuid4()}"
    payload = {
        "business_owner_id": tenant_id,
        "event_type": "income_received",
        "amount": "200.00",
        "currency": "ZAR",
        "description": "Timeout Payment",
        "occurred_at": "2026-08-15T12:00:00Z",
        "accounting_category": "Income",
        "cash_direction": "inflow",
        "creates_obligation": False
    }

    # First request succeeds (simulating the client losing network connection after it succeeds on server)
    resp1 = client.post("/api/v1/financial-events", json=payload, headers={"Idempotency-Key": idempotency_key})
    assert resp1.status_code == 200
    first_id = resp1.json()["id"]

    # Client retries
    resp2 = client.post("/api/v1/financial-events", json=payload, headers={"Idempotency-Key": idempotency_key})
    assert resp2.status_code == 200
    assert resp2.json()["id"] == first_id

    # Cross-tenant retry with the same key
    from src.auth.supabase_auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": setup_tenants["B"], "email": "b@example.com"}
    
    payload_b = payload.copy()
    payload_b["business_owner_id"] = setup_tenants["B"]
    
    resp_cross = client.post("/api/v1/financial-events", json=payload_b, headers={"Idempotency-Key": idempotency_key})
    assert resp_cross.status_code == 200
    assert resp_cross.json()["id"] != first_id

    app.dependency_overrides[get_current_user] = lambda: {"uid": tenant_id, "email": "a@example.com"}


def test_payment_interruption_rolls_back(db: Session, setup_tenants, auth_mock):
    """
    Test 6: Interrupted payment workflow.
    Failures between payment confirmation and ledger event creation leave no impossible state.
    """
    tenant_id = setup_tenants["A"]
    client = TestClient(app, raise_server_exceptions=False)

    payment = PaymentIntent(
        id=uuid.uuid4(),
        business_owner_id=tenant_id,
        amount=Decimal("300.00"),
        currency="ZAR",
        provider_name="payfast",
        payment_reference=f"DEMO-{uuid.uuid4()}",
        status=PaymentIntentStatus.pending,
        continuity_event_id=uuid.uuid4()
    )
    db.add(payment)

    payment_event = ContinuityEvent(
        id=payment.continuity_event_id,
        business_owner_id=tenant_id,
        event_type="payment_intent_created",
        actor_type="system",
        related_entity_type="payment_intent",
        related_entity_id=str(payment.id)
    )
    db.add(payment_event)
    
    db.commit()

    import src.routers.payments
    original_emit = src.routers.payments.emit_continuity_event
    call_count = 0
    def mock_emit(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 2:
            raise RuntimeError("Simulated Ledger Failure")
        return original_emit(*args, **kwargs)

    with patch("src.routers.payments.emit_continuity_event", side_effect=mock_emit):
        resp = client.post(f"/api/v1/payments/{payment.id}/confirm-demo")
        assert resp.status_code == 500

    db.refresh(payment)
    assert payment.status == PaymentIntentStatus.pending
    
    events = db.query(ContinuityEvent).filter(ContinuityEvent.related_entity_id == str(payment.id)).all()
    # The first event was rolled back!
    assert not any(e.event_type == "payment_confirmed" for e in events)

