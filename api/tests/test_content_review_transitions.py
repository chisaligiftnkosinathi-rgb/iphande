import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.routes.content_post_routes import get_db as get_content_post_db


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


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_content_post_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_content_post_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def generate_review_post():
    response = client.post(
        "/api/v1/content-posts/generate",
        json={
            "business_owner_id": "BO003",
            "business_category_key": "beauty_salon",
            "business_line": "Beauty Salon",
            "platform": "facebook",
            "goal_key": "request_bookings",
            "offer_details": "Hair styling and nails available this week.",
            "location": "Pretoria",
            "contact_method": "WhatsApp",
            "tone": "friendly",
        },
    )
    assert response.status_code == 200
    return response.json()


def get_event_types(content_post_id: str):
    db = TestingSessionLocal()
    try:
        return [
            event.event_type
            for event in db.query(ContinuityEvent)
            .filter(
                ContinuityEvent.related_entity_type == "content_post",
                ContinuityEvent.related_entity_id == content_post_id,
            )
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        ]
    finally:
        db.close()


def test_generated_content_can_be_approved_with_replay_event():
    generated = generate_review_post()
    content_post_id = generated["content_post_id"]

    response = client.post(f"/api/v1/content-posts/{content_post_id}/approve")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "approved"
    assert body["template_key"] == "beauty_salon_booking_slots"
    assert get_event_types(content_post_id)[-1] == "content_approved"


def test_generated_content_can_be_rejected_with_replay_event():
    generated = generate_review_post()
    content_post_id = generated["content_post_id"]

    response = client.post(f"/api/v1/content-posts/{content_post_id}/reject")

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    assert get_event_types(content_post_id)[-1] == "content_rejected"


def test_generated_content_can_be_shared_after_approval_with_replay_event():
    generated = generate_review_post()
    content_post_id = generated["content_post_id"]
    approve_response = client.post(f"/api/v1/content-posts/{content_post_id}/approve")
    assert approve_response.status_code == 200

    response = client.post(
        f"/api/v1/content-posts/{content_post_id}/mark-shared",
        json="facebook",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "shared"
    assert body["channel"] == "facebook"
    assert get_event_types(content_post_id)[-2:] == ["content_approved", "content_shared"]


def test_content_posts_can_be_filtered_for_review_workspace():
    generate_review_post()

    response = client.get("/api/v1/content-posts?owner_profile_id=BO003&status=draft")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["owner_profile_id"] == "BO003"
    assert body[0]["status"] == "draft"
    assert body[0]["template_key"] == "beauty_salon_booking_slots"
