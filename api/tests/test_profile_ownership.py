import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base, get_db, register_models
from src.models.profile import Profile
from src.main import app
from src.routes.profile_routes import get_db as get_profile_db
from fastapi.testclient import TestClient

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
    app.dependency_overrides[get_profile_db] = override_get_db
    register_models()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_profile_tolerates_owner_id(db_session):
    profile = Profile(name="Test Business", slug="test-business", email="test@example.com", owner_id="firebase_uid_123")
    db_session.add(profile)
    db_session.commit()

    saved_profile = db_session.query(Profile).filter_by(slug="test-business").first()
    assert saved_profile is not None
    assert saved_profile.owner_id == "firebase_uid_123"

def test_profile_tolerates_null_owner_id(db_session):
    profile = Profile(name="Null Owner", slug="null-owner", email="null@example.com")
    db_session.add(profile)
    db_session.commit()

    saved_profile = db_session.query(Profile).filter_by(slug="null-owner").first()
    assert saved_profile is not None
    assert saved_profile.owner_id is None

def test_create_profile_accepts_and_persists_owner_id(db_session):
    response = client.post("/api/v1/profiles", json={
        "name": "Firebase User",
        "slug": "firebase-user",
        "email": "firebase@example.com",
        "owner_id": "firebase_uid_999",
        "provider_type": "Small Business",
        "business_category_key": "tech_digital_services",
        "business_line": "App Development",
        "location": "Emalahleni",
        "short_bio": "Simplifying digital complexity."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["owner_id"] == "firebase_uid_999"
    assert data["provider_type"] == "Small Business"
    assert data["business_category_key"] == "tech_digital_services"
    assert data["business_line"] == "App Development"
    assert data["location"] == "Emalahleni"
    assert data["short_bio"] == "Simplifying digital complexity."

    saved_profile = db_session.query(Profile).filter_by(owner_id="firebase_uid_999").first()
    assert saved_profile is not None

def test_create_profile_is_idempotent_for_same_owner_id(db_session):
    payload = {
        "name": "Idempotent User",
        "slug": "idempotent-user",
        "email": "idempotent@example.com",
        "owner_id": "firebase_uid_idempotent"
    }
    response1 = client.post("/api/v1/profiles", json=payload)
    assert response1.status_code == 200
    profile_id1 = response1.json()["id"]

    response2 = client.post("/api/v1/profiles", json=payload)
    assert response2.status_code == 200
    profile_id2 = response2.json()["id"]

    assert profile_id1 == profile_id2
    assert db_session.query(Profile).filter_by(owner_id="firebase_uid_idempotent").count() == 1

def test_get_profile_by_owner_id_returns_correct_profile(db_session):
    client.post("/api/v1/profiles", json={"name": "Owner Lookup", "slug": "owner-lookup", "email": "owner-lookup@example.com", "owner_id": "firebase_uid_lookup"})
    response = client.get("/api/v1/profiles/by-owner/firebase_uid_lookup")
    assert response.status_code == 200
    assert response.json()["owner_id"] == "firebase_uid_lookup"
    assert response.json()["name"] == "Owner Lookup"

    response_404 = client.get("/api/v1/profiles/by-owner/unknown_owner")
    assert response_404.status_code == 404
