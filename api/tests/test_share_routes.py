from src.database import get_db
import pytest
from fastapi.testclient import TestClient
import uuid
from decimal import Decimal
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.database import Base, engine as prod_engine
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.models.quote import Quote
from src.models.continuity_event_model import ContinuityEvent

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


def test_share_profile():
    db = setup_db()
    try:
        pid = str(uuid.uuid4())
        profile = Profile(
            id=pid,
            name="John Doe Plumbers",
            slug="john-doe-plumbers",
            email="john@example.com",
            province="Gauteng",
            city="Pretoria",
            services="Fixing leaks, installations",
            whatsapp_number="0711234567"
        )
        db.add(profile)
        db.commit()

        response = client.get(f"/api/v1/share/profile/{pid}")
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "profile"
        assert "John Doe Plumbers" in data["share_text"]
        assert "Pretoria" in data["share_text"]
        assert "Fixing leaks" in data["share_text"]
        assert "0711234567" in data["share_text"]
        assert "Shared from iPhande" in data["share_text"]
    finally:
        teardown_db()


def test_share_opportunity():
    db = setup_db()
    try:
        oid = str(uuid.uuid4())
        opp = Opportunity(
            id=oid,
            created_by_profile_id="some-id",
            title="Need pipes fixed",
            service_needed="Pipe fixing",
            province="Western Cape",
            town_or_city="Cape Town"
        )
        db.add(opp)
        db.commit()

        response = client.get(f"/api/v1/share/opportunity/{oid}")
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "opportunity"
        assert "Need pipes fixed" in data["share_text"]
        assert "Pipe fixing" in data["share_text"]
        assert "Cape Town" in data["share_text"]
        assert "Shared from iPhande" in data["share_text"]
    finally:
        teardown_db()


def test_share_quote():
    db = setup_db()
    try:
        qid = uuid.uuid4()
        q = Quote(
            id=qid,
            business_owner_id="owner",
            customer_name="Alice",
            description="Fixing sink",
            amount=Decimal("1500.50"),
            currency="ZAR",
            status="issued",
            continuity_event_id=uuid.uuid4()
        )
        db.add(q)
        db.commit()

        response = client.get(f"/api/v1/share/quote/{str(qid)}")
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "quote"
        assert "Alice" in data["share_text"]
        assert "Fixing sink" in data["share_text"]
        assert "1500.50" in data["share_text"]
        assert "Shared from iPhande" in data["share_text"]
    finally:
        teardown_db()


def test_share_continuity_event():
    db = setup_db()
    try:
        eid = uuid.uuid4()
        event = ContinuityEvent(
            id=eid,
            business_owner_id="owner",
            event_type="work_completed",
            payload_json={
                "title": "Sink repaired",
                "description": "Replaced the pipe and tested for leaks"
            }
        )
        db.add(event)
        db.commit()

        response = client.get(f"/api/v1/share/continuity-event/{str(eid)}")
        assert response.status_code == 200
        data = response.json()
        assert data["source_type"] == "proof_of_work"
        assert "Sink repaired" in data["share_text"]
        assert "Replaced the pipe" in data["share_text"]
        assert "Shared from iPhande" in data["share_text"]
    finally:
        teardown_db()
