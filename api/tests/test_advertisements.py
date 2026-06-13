import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.database import get_db, Base, get_db, register_models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    register_models()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.clear()


def test_create_advertisement_sets_default_expiry():
    payload = {
        "title": "Need a gardener",
        "description": "Large garden cleanup",
        "category_key": "gardening",
        "province": "Gauteng",
        "town_or_city": "Pretoria",
        "suburb_or_area": "Menlyn",
        "contact_name": "Alice",
        "contact_whatsapp": "+27820001111",
        "price_or_budget": "R500"
    }

    response = client.post("/api/v1/advertisements/public", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Need a gardener"
    assert data["payment_status"] == "pending"
    assert data["advert_status"] == "pending_review"

    # Check default 3 days expiry
    created_at = datetime.fromisoformat(data["created_at"])
    expires_at = datetime.fromisoformat(data["expires_at"])
    delta = expires_at - created_at
    assert 2 <= delta.days <= 3  # Roughly 3 days


def test_admin_can_approve_advertisement():
    # 1. Create ad
    payload = {
        "title": "Need a plumber",
        "category_key": "plumbing",
        "province": "Gauteng",
        "town_or_city": "Johannesburg",
        "contact_name": "Bob",
        "contact_whatsapp": "+27820002222"
    }
    response = client.post("/api/v1/advertisements/public", json=payload)
    ad_id = response.json()["id"]

    # 2. Check it's pending
    pending_res = client.get("/api/v1/admin/advertisements/pending")
    assert pending_res.status_code == 200
    pending_ads = pending_res.json()
    assert any(ad["id"] == ad_id for ad in pending_ads)

    # 3. Approve it
    approve_res = client.patch(f"/api/v1/admin/advertisements/{ad_id}/approve")
    assert approve_res.status_code == 200
    approved_ad = approve_res.json()
    assert approved_ad["payment_status"] == "paid"
    assert approved_ad["advert_status"] == "active"

    # 4. Check it's no longer pending
    pending_res2 = client.get("/api/v1/admin/advertisements/pending")
    pending_ads2 = pending_res2.json()
    assert not any(ad["id"] == ad_id for ad in pending_ads2)

    # 5. Check it's in active public feed
    public_res = client.get("/api/v1/advertisements/public")
    assert public_res.status_code == 200
    active_ads = public_res.json()
    assert any(ad["id"] == ad_id for ad in active_ads)


def test_admin_can_reject_advertisement():
    # 1. Create ad
    payload = {
        "title": "Spam advert",
        "category_key": "spam",
        "province": "Gauteng",
        "town_or_city": "Johannesburg",
        "contact_name": "Spammer",
        "contact_whatsapp": "+27820003333"
    }
    response = client.post("/api/v1/advertisements/public", json=payload)
    ad_id = response.json()["id"]

    # 2. Reject it
    reject_res = client.patch(f"/api/v1/admin/advertisements/{ad_id}/reject")
    assert reject_res.status_code == 200
    rejected_ad = reject_res.json()
    assert rejected_ad["payment_status"] == "rejected"
    assert rejected_ad["advert_status"] == "rejected"

    # 3. Ensure it's not in public feed
    public_res = client.get("/api/v1/advertisements/public")
    active_ads = public_res.json()
    assert not any(ad["id"] == ad_id for ad in active_ads)
