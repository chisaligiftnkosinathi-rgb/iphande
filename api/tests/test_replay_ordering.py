import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
from src.models.continuity_event_model import ContinuityEvent
from src.routes.content_post_routes import get_db as get_content_post_db
from src.services.continuity_event_service import emit_continuity_event


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


def test_replay_event_ordering_is_deterministic():
    payload = {
        "business_owner_id": "test-owner-123",
        "business_category_key": "commission_based_sales",
        "business_line": "Funeral Cover Agent",
        "platform": "facebook",
        "goal_key": "request_quotes",
    }

    response = client.post("/api/v1/content-posts/generate", json=payload)
    assert response.status_code == 200
    post_id = response.json()["content_post_id"]

    timeline_response = client.get(f"/api/v1/content-posts/{post_id}/timeline")
    assert timeline_response.status_code == 200
    event_sequence = [e["event_type"] for e in timeline_response.json()["events"]]

    expected_logical_order = [
        "prompt_context_built",
        "template_selected",
        "public_caption_composed",
        "platform_format_applied",
        "content_generated",
    ]

    assert event_sequence == expected_logical_order


def generate_demo_content_post():
    payload = {
        "business_owner_id": "test-owner-123",
        "business_category_key": "commission_based_sales",
        "business_line": "Funeral Cover Agent",
        "platform": "facebook",
        "goal_key": "request_quotes",
    }
    response = client.post("/api/v1/content-posts/generate", json=payload)
    assert response.status_code == 200
    return response.json()["content_post_id"]


def get_post_events(post_id: str):
    db = TestingSessionLocal()
    try:
        return [
            {
                "id": str(event.id),
                "event_type": event.event_type,
                "parent_event_id": str(event.parent_event_id) if event.parent_event_id else None,
                "lineage_sequence": event.lineage_sequence,
            }
            for event in db.query(ContinuityEvent)
            .filter(
                ContinuityEvent.related_entity_type == "content_post",
                ContinuityEvent.related_entity_id == post_id,
            )
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        ]
    finally:
        db.close()


def test_generated_content_events_are_parent_linked_in_order():
    post_id = generate_demo_content_post()
    events = get_post_events(post_id)

    assert [event["event_type"] for event in events] == [
        "prompt_context_built",
        "template_selected",
        "public_caption_composed",
        "platform_format_applied",
        "content_generated",
    ]
    assert events[0]["parent_event_id"] is None
    assert events[1]["parent_event_id"] == events[0]["id"]
    assert events[2]["parent_event_id"] == events[1]["id"]
    assert events[3]["parent_event_id"] == events[2]["id"]
    assert events[4]["parent_event_id"] == events[3]["id"]
    assert [event["lineage_sequence"] for event in events] == sorted(
        event["lineage_sequence"] for event in events
    )


def test_generated_content_graph_returns_generation_chain():
    post_id = generate_demo_content_post()
    events = get_post_events(post_id)

    response = client.get(
        f"/api/v1/continuity-events/{events[0]['id']}/graph?direction=downstream&max_depth=5"
    )

    assert response.status_code == 200
    body = response.json()
    assert [node["id"] for node in body["nodes"]] == [event["id"] for event in events]
    assert body["edges"] == [
        {"source_event_id": events[0]["id"], "target_event_id": events[1]["id"]},
        {"source_event_id": events[1]["id"], "target_event_id": events[2]["id"]},
        {"source_event_id": events[2]["id"], "target_event_id": events[3]["id"]},
        {"source_event_id": events[3]["id"], "target_event_id": events[4]["id"]},
    ]
    assert body["truncated"] is False
    assert body["cycle_detected"] is False


def test_entity_replay_still_returns_generated_events_in_sequence_order():
    post_id = generate_demo_content_post()
    events = get_post_events(post_id)

    response = client.get(f"/api/v1/continuity-events/entity/{post_id}")

    assert response.status_code == 200
    body = response.json()
    assert [event["id"] for event in body] == [event["id"] for event in events]
    assert [event["lineage_sequence"] for event in body] == [
        event["lineage_sequence"] for event in events
    ]


def test_generation_chain_does_not_mutate_existing_events():
    db = TestingSessionLocal()
    try:
        old_event = emit_continuity_event(
            db,
            business_owner_id="test-owner-123",
            business_category_key=None,
            business_line=None,
            event_type="old_unlinked_event",
            actor_type="system",
        )
        old_event_id = old_event.id
    finally:
        db.close()

    generate_demo_content_post()

    db = TestingSessionLocal()
    try:
        unchanged_event = db.query(ContinuityEvent).filter(ContinuityEvent.id == old_event_id).first()
        assert unchanged_event.parent_event_id is None
        assert unchanged_event.event_type == "old_unlinked_event"
    finally:
        db.close()
