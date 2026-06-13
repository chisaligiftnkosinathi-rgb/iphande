from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db, Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.models.inventory import InventoryMovement


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


def create_item():
    response = client.post(
        "/api/v1/inventory/items",
        json={
            "business_owner_id": "BO004",
            "sku": "BEAUTY-OIL-001",
            "name": "Hair Treatment Oil",
            "unit": "bottle",
        },
    )
    assert response.status_code == 200
    return response.json()


def test_inventory_add_and_consume_preserves_balance_replay():
    item = create_item()

    add_response = client.post(
        f"/api/v1/inventory/items/{item['id']}/add-stock",
        json={
            "quantity": "10",
            "reference_type": "purchase",
            "reference_id": "PO-001",
            "notes": "Opening stock",
            "approved_by": "BO004",
        },
    )
    assert add_response.status_code == 200
    assert add_response.json()["previous_balance"] == "0.00"
    assert add_response.json()["next_balance"] == "10.00"

    consume_response = client.post(
        f"/api/v1/inventory/items/{item['id']}/consume-stock",
        json={
            "quantity": "3",
            "reference_type": "quote",
            "reference_id": "QUOTE-001",
            "notes": "Used for customer treatment",
            "approved_by": "BO004",
        },
    )
    assert consume_response.status_code == 200
    assert consume_response.json()["previous_balance"] == "10.00"
    assert consume_response.json()["next_balance"] == "7.00"

    balances_response = client.get("/api/v1/inventory/business/BO004/balances")
    assert balances_response.status_code == 200
    balances = balances_response.json()
    assert len(balances) == 1
    assert balances[0]["balance"] == "7.00"

    replay_response = client.get(f"/api/v1/inventory/items/{item['id']}/replay")
    assert replay_response.status_code == 200
    assert [movement["movement_type"] for movement in replay_response.json()] == [
        "stock_added",
        "stock_consumed",
    ]

    db = TestingSessionLocal()
    try:
        movements = db.query(InventoryMovement).order_by(InventoryMovement.created_at.asc()).all()
        assert [movement.next_balance for movement in movements] == [
            Decimal("10.00"),
            Decimal("7.00"),
        ]
        events = db.query(ContinuityEvent).order_by(ContinuityEvent.lineage_sequence.asc()).all()
        assert [event.event_type for event in events] == [
            "inventory_movement_recorded",
            "inventory_balance_changed",
            "inventory_movement_recorded",
            "inventory_balance_changed",
        ]
        assert events[1].parent_event_id == events[0].id
        assert events[3].parent_event_id == events[2].id
        assert events[3].payload_json["previous_balance"] == "10.00"
        assert events[3].payload_json["movement_quantity"] == "3"
        assert events[3].payload_json["next_balance"] == "7.00"
        assert events[3].payload_json["reference_type"] == "quote"
        assert events[3].payload_json["reference_id"] == "QUOTE-001"
    finally:
        db.close()


def test_inventory_consumption_cannot_create_negative_balance():
    item = create_item()

    response = client.post(
        f"/api/v1/inventory/items/{item['id']}/consume-stock",
        json={"quantity": "1", "approved_by": "BO004"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Inventory movement would create negative balance"


def test_duplicate_sku_is_rejected_per_business():
    create_item()

    response = client.post(
        "/api/v1/inventory/items",
        json={
            "business_owner_id": "BO004",
            "sku": "BEAUTY-OIL-001",
            "name": "Hair Treatment Oil",
            "unit": "bottle",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Inventory item SKU already exists for this business"
