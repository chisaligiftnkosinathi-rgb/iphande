from datetime import date
from decimal import Decimal
import uuid

from fastapi.testclient import TestClient

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.database import Base, engine as prod_engine
from src.models.quote import Quote
from src.models.expense import Expense

client = TestClient(app)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def setup_db():
    from src.database import register_models
    register_models()
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    from src.database import get_db
    return db


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def teardown_db():
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()
    app.dependency_overrides.clear()


def test_expense_creation():
    db = setup_db()
    try:
        payload = {
            "business_owner_id": "owner-1",
            "amount": "150.50",
            "category": "Fuel",
            "description": "Petrol for delivery",
            "date": date.today().isoformat()
        }
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "150.50"
        assert data["category"] == "Fuel"
        assert "id" in data
    finally:
        teardown_db()


def test_expense_amount_must_be_positive():
    db = setup_db()
    try:
        payload = {
            "business_owner_id": "owner-1",
            "amount": "-50.00",
            "category": "Fuel",
            "description": "Petrol for delivery",
            "date": date.today().isoformat()
        }
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 422  # Pydantic validation error
    finally:
        teardown_db()


def test_expense_amount_must_be_positive_zero():
    db = setup_db()
    try:
        payload = {
            "business_owner_id": "owner-1",
            "amount": "0.00",
            "category": "Fuel",
            "description": "Petrol for delivery",
            "date": date.today().isoformat()
        }
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 422  # Pydantic validation error
    finally:
        teardown_db()


def test_expense_summary():
    db = setup_db()
    try:
        # 1. Create accepted quote (income)
        q = Quote(
            id=uuid.UUID("123e4567-e89b-12d3-a456-426614174000"),
            business_owner_id="owner-2",
            customer_request_id="req-1",
            customer_name="Test Customer",
            description="Test description",
            amount=Decimal("15000.00"),
            currency="ZAR",
            status="accepted",
            continuity_event_id=uuid.uuid4()
        )
        db.add(q)

        # 2. Create some expenses
        e1 = Expense(
            business_owner_id="owner-2",
            amount=Decimal("5000.00"),
            category="Rent",
            date=date.today()
        )
        e2 = Expense(
            business_owner_id="owner-2",
            amount=Decimal("2000.00"),
            category="Fuel",
            date=date.today()
        )
        db.add(e1)
        db.add(e2)
        db.commit()

        # 3. Request summary
        response = client.get(
            "/api/v1/expenses/summary?business_owner_id=owner-2")
        assert response.status_code == 200
        data = response.json()
        assert data["income"] == "15000.00"
        assert data["expenses"] == "7000.00"
        assert data["net_position"] == "8000.00"
    finally:
        teardown_db()


def test_expense_summary_zero_income():
    db = setup_db()
    try:
        # Create only expense, no income
        e1 = Expense(
            business_owner_id="owner-3",
            amount=Decimal("1500.00"),
            category="Tools",
            date=date.today()
        )
        db.add(e1)
        db.commit()

        response = client.get(
            "/api/v1/expenses/summary?business_owner_id=owner-3")
        assert response.status_code == 200
        data = response.json()
        assert data["income"] == "0.00"
        assert data["expenses"] == "1500.00"
        assert data["net_position"] == "-1500.00"
    finally:
        teardown_db()
