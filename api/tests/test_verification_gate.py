import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database import get_db, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.models.profile import Profile

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

def test_unverified_steward_gets_403_on_leads():
    db = TestingSessionLocal()
    # Create unverified profile
    unverified = Profile(
        id="unverified-123",
        owner_id="uid-123",
        email="unverified@example.com",
        name="Unverified Plumbing",
        slug="unverified-plumbing",
        setup_fee_status="pending",
        is_verified=False
    )
    db.add(unverified)
    db.commit()
    db.close()

    # Create a mock auth override for the unverified user
    from src.auth.supabase_auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": "uid-123", "email": "unverified@example.com"}

    # Access leads endpoint
    response = client.get("/api/v1/leads?business_owner_id=unverified-123")
    assert response.status_code == 403
    assert "Steward verification required" in response.json()["detail"]

    app.dependency_overrides.pop(get_current_user, None)

def test_system_creator_bypasses_verification():
    db = TestingSessionLocal()
    # Create system creator profile (unverified by typical means)
    system_creator = Profile(
        id="creator-123",
        owner_id="uid-creator",
        email="glegacey97@gmail.com",
        name="System Creator",
        slug="system-creator",
        setup_fee_status="pending",
        is_verified=False,
        trust_posture="system_creator",
        role="system_admin"
    )
    db.add(system_creator)
    db.commit()
    db.close()

    # Create a mock auth override for the creator
    from src.auth.supabase_auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"uid": "uid-creator", "email": "glegacey97@gmail.com"}

    # Access leads endpoint - should NOT get 403
    response = client.get("/api/v1/leads?business_owner_id=creator-123")
    assert response.status_code == 200

    app.dependency_overrides.pop(get_current_user, None)
