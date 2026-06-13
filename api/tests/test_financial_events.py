from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db, Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.models.financial_event import FinancialEvent


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


def test_financial_event_appends_continuity_event():
    payload = {
        "business_owner_id": "test-owner-123",
        "event_type": "income_received",
        "amount": "500.00",
        "currency": "ZAR",
        "description": "Customer paid cash for funeral cover consultation",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "accounting_category": "Income",
        "cash_direction": "inflow",
        "source_actor": "customer",
        "counterparty": "Customer A",
        "creates_obligation": False,
    }

    response = client.post("/api/v1/financial-events", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["event_type"] == "income_received"
    assert body["continuity_event_id"]

    db = TestingSessionLocal()
    try:
        financial_event = db.query(FinancialEvent).first()
        continuity_event = db.query(ContinuityEvent).first()
        assert financial_event is not None
        assert continuity_event is not None
        assert str(financial_event.continuity_event_id) == str(continuity_event.id)
        assert continuity_event.event_type == "income_received"
        assert continuity_event.related_entity_type == "financial_event"
        assert continuity_event.related_entity_id == str(financial_event.id)
    finally:
        db.close()


def test_cash_replay_separates_inflow_from_outflow():
    _post_financial_event("income_received", "500.00", "Income", "inflow")
    _post_financial_event("expense_paid", "120.00", "Expense", "outflow")

    response = client.get("/api/v1/financial-events/business/test-owner-123/cash-replay")

    assert response.status_code == 200
    body = response.json()
    assert body["inflow_total"] == "500.00"
    assert body["outflow_total"] == "120.00"
    assert body["net_cash"] == "380.00"
    assert len(body["events"]) == 2


def test_profit_snapshot_does_not_count_asset_purchase_as_expense():
    _post_financial_event("income_received", "500.00", "Income", "inflow")
    _post_financial_event("asset_acquired", "200.00", "Asset", "outflow")
    _post_financial_event("expense_paid", "80.00", "Expense", "outflow")

    response = client.get("/api/v1/financial-events/business/test-owner-123/profit-snapshot")

    assert response.status_code == 200
    body = response.json()
    assert body["income_total"] == "500.00"
    assert body["expense_total"] == "80.00"
    assert body["profit"] == "420.00"


def test_obligation_view_surfaces_debt_pressure():
    _post_financial_event(
        "debt_created",
        "300.00",
        "Liability",
        "none",
        creates_obligation=True,
    )
    _post_financial_event("expense_paid", "50.00", "Expense", "outflow")

    response = client.get("/api/v1/financial-events/business/test-owner-123/obligations")

    assert response.status_code == 200
    body = response.json()
    assert body["obligation_total"] == "300.00"
    assert len(body["obligations"]) == 1
    assert body["obligations"][0]["event_type"] == "debt_created"


def _post_financial_event(
    event_type: str,
    amount: str,
    accounting_category: str,
    cash_direction: str,
    creates_obligation: bool = False,
):
    response = client.post(
        "/api/v1/financial-events",
        json={
            "business_owner_id": "test-owner-123",
            "event_type": event_type,
            "amount": amount,
            "currency": "ZAR",
            "description": f"{event_type} test event",
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "accounting_category": accounting_category,
            "cash_direction": cash_direction,
            "source_actor": "business_owner",
            "counterparty": "Test counterparty",
            "creates_obligation": creates_obligation,
        },
    )
    assert response.status_code == 200
    return response.json()
