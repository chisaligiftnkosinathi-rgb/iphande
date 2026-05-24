import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base, get_db
from src.main import app
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


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def client():
    return TestClient(app)


def build_graph_events():
    db = TestingSessionLocal()
    try:
        root = emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="root_event",
            actor_type="system",
        )
        child = emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="child_event",
            actor_type="system",
            parent_event_id=root.id,
        )
        grandchild = emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="grandchild_event",
            actor_type="system",
            parent_event_id=child.id,
        )
        return str(root.id), str(child.id), str(grandchild.id)
    finally:
        db.close()


def test_graph_downstream_reveals_recorded_children(client):
    root_id, child_id, grandchild_id = build_graph_events()

    response = client.get(f"/api/v1/continuity-events/{root_id}/graph?direction=downstream")

    assert response.status_code == 200
    body = response.json()
    assert body["root_event"]["id"] == root_id
    assert [node["id"] for node in body["nodes"]] == [
        root_id,
        child_id,
        grandchild_id,
    ]
    assert body["edges"] == [
        {"source_event_id": root_id, "target_event_id": child_id},
        {"source_event_id": child_id, "target_event_id": grandchild_id},
    ]
    assert body["truncated"] is False
    assert body["cycle_detected"] is False
    assert body["max_depth"] == 5


def test_graph_upstream_reveals_recorded_parents(client):
    root_id, child_id, grandchild_id = build_graph_events()

    response = client.get(f"/api/v1/continuity-events/{grandchild_id}/graph?direction=upstream")

    assert response.status_code == 200
    body = response.json()
    assert [node["id"] for node in body["nodes"]] == [
        root_id,
        child_id,
        grandchild_id,
    ]
    assert body["edges"] == [
        {"source_event_id": root_id, "target_event_id": child_id},
        {"source_event_id": child_id, "target_event_id": grandchild_id},
    ]


def test_graph_both_directions_combines_upstream_and_downstream(client):
    root_id, child_id, grandchild_id = build_graph_events()

    response = client.get(f"/api/v1/continuity-events/{child_id}/graph?direction=both")

    assert response.status_code == 200
    body = response.json()
    assert body["root_event"]["id"] == child_id
    assert [node["id"] for node in body["nodes"]] == [
        root_id,
        child_id,
        grandchild_id,
    ]
    assert len(body["edges"]) == 2


def test_graph_respects_max_depth_and_reports_truncation(client):
    root_id, child_id, _grandchild_id = build_graph_events()

    response = client.get(
        f"/api/v1/continuity-events/{root_id}/graph?direction=downstream&max_depth=1"
    )

    assert response.status_code == 200
    body = response.json()
    assert [node["id"] for node in body["nodes"]] == [root_id, child_id]
    assert body["truncated"] is True
    assert body["max_depth"] == 1


def test_graph_returns_404_for_unknown_event(client):
    response = client.get(f"/api/v1/continuity-events/{uuid.uuid4()}/graph")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found"}


def test_entity_replay_returns_events_for_recorded_entity_only(client):
    entity_id = str(uuid.uuid4())
    unrelated_entity_id = str(uuid.uuid4())
    db = TestingSessionLocal()
    try:
        first_event = emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="first_entity_event",
            actor_type="system",
            related_entity_id=entity_id,
        )
        second_event = emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="second_entity_event",
            actor_type="system",
            related_entity_id=entity_id,
        )
        emit_continuity_event(
            db,
            business_owner_id="owner-1",
            business_category_key=None,
            business_line=None,
            event_type="unrelated_event",
            actor_type="system",
            related_entity_id=unrelated_entity_id,
        )
        expected_ids = [str(first_event.id), str(second_event.id)]
    finally:
        db.close()

    response = client.get(f"/api/v1/continuity-events/entity/{entity_id}")

    assert response.status_code == 200
    body = response.json()
    assert [event["id"] for event in body] == expected_ids
    assert all(event["related_entity_id"] == entity_id for event in body)
