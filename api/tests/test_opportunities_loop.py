from src.database import get_db
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Test database setup
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
    from src.database import register_models
    register_models()
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def test_opportunities_loop():
    # 1. Create a Steward Profile (needed for created_by_profile_id and quotes)
    profile_data = {
        "id": "steward-123",
        "email": "teststeward@example.com",
        "name": "Test Plumbing",
        "slug": "test-plumbing",
        "business_category_key": "plumbing",
        "province": "gauteng",
        "city": "pretoria"
    }

    # We create the profile directly in the database since there isn't a direct creation endpoint for full models in tests yet,
    # or we can use the endpoints if available. Let's use the DB directly for setup.
    db = TestingSessionLocal()
    from src.models.profile import Profile
    from src.models.continuity_event_model import ContinuityEvent
    db.add(Profile(**profile_data))
    db.commit()
    
    # 5. Create Opportunity
    opp_data = {
        "created_by_profile_id": "steward-123",
        "title": "Need a mechanic to fix my brakes",
        "description": "Brakes are squeaking loudly",
        "category_key": "mechanic_auto",
        "service_needed": "Brake pad replacement",
        "province": "gauteng",
        "town_or_city": "pretoria",
        "suburb_or_area": "menlyn",
        "contact_name": "John Doe",
        "contact_phone": "0710000000",
        "budget_amount": "1500"
    }
    
    response = client.post("/api/v1/opportunities", json=opp_data)
    assert response.status_code == 200, response.text
    created_opp = response.json()
    assert created_opp["title"] == opp_data["title"]
    assert created_opp["status"] == "open"
    opp_id = created_opp["id"]

    # Verify timeline event for creation
    events = db.query(ContinuityEvent).filter(ContinuityEvent.related_entity_id == opp_id).all()
    assert any(e.event_type == "opportunity_created" for e in events)

    # 6. Confirm it appears in feed
    # 2. Filter by Province
    # 3. Filter by Town/City
    # 4. Filter by Category
    response = client.get("/api/v1/opportunities?province=gauteng&town_or_city=pretoria&category_key=mechanic_auto")
    assert response.status_code == 200
    feed = response.json()
    assert len(feed) > 0
    assert any(o["id"] == opp_id for o in feed)

    # 8. Confirm status becomes contacted
    # 7. Tap Contact (frontend does a PATCH)
    patch_data = {"status": "contacted"}
    response = client.patch(f"/api/v1/opportunities/{opp_id}", json=patch_data)
    assert response.status_code == 200
    updated_opp = response.json()
    assert updated_opp["status"] == "contacted"

    # Verify timeline event for contacted
    events = db.query(ContinuityEvent).filter(ContinuityEvent.related_entity_id == opp_id).all()
    assert any(e.event_type == "opportunity_contacted" for e in events)

    # 11. Save Quote
    quote_data = {
        "opportunity_id": opp_id,
        "business_owner_id": "steward-123",
        "customer_name": "John Doe",
        "customer_phone": "0710000000",
        "amount": 1450.00,
        "description": "Brake repairs",
        "status": "draft",
        "line_items": [
            {
                "description": "Brake pads",
                "quantity": 1,
                "unit_price": 800.00,
                "total_price": 800.00
            },
            {
                "description": "Labor",
                "quantity": 2,
                "unit_price": 325.00,
                "total_price": 650.00
            }
        ]
    }
    
    response = client.post("/api/v1/quotes", json=quote_data)
    assert response.status_code == 200, response.text
    created_quote = response.json()
    assert created_quote["customer_name"] == quote_data["customer_name"]

    # 12. Confirm Opportunity becomes quoted
    # The user rule states: "Then if quote saves successfully, mark it as quoted."
    # We emulate frontend doing this, or backend doing this if Quote creation triggers it.
    # In V1 the frontend usually PATCHes the status to 'quoted'.
    patch_data_quoted = {"status": "quoted"}
    response = client.patch(f"/api/v1/opportunities/{opp_id}", json=patch_data_quoted)
    assert response.status_code == 200
    updated_opp_quoted = response.json()
    assert updated_opp_quoted["status"] == "quoted"

    # 13. Confirm Timeline shows:
    # - opportunity_created
    # - opportunity_contacted
    # - opportunity_quoted
    events = db.query(ContinuityEvent).filter(ContinuityEvent.related_entity_id == opp_id).order_by(ContinuityEvent.created_at.asc()).all()
    event_types = [e.event_type for e in events]
    assert "opportunity_created" in event_types
    assert "opportunity_contacted" in event_types
    assert "opportunity_quoted" in event_types
    
    db.close()
