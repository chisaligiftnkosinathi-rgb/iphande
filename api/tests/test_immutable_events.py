import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models.continuity_event_model import ContinuityEvent


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_continuity_event_cannot_be_updated():
    db = TestingSessionLocal()

    event = ContinuityEvent(
        business_owner_id="test-owner-123",
        event_type="test_event",
        actor_type="system",
    )
    db.add(event)
    db.commit()

    event.event_type = "maliciously_modified_event"

    with pytest.raises(RuntimeError, match="Immutable Timeline Doctrine Violation"):
        db.commit()
    db.close()


def test_continuity_event_cannot_be_deleted():
    db = TestingSessionLocal()

    event = ContinuityEvent(
        business_owner_id="owner-456",
        event_type="test_event",
        actor_type="system",
    )
    db.add(event)
    db.commit()

    db.delete(event)

    with pytest.raises(RuntimeError, match="Immutable Timeline Doctrine Violation"):
        db.commit()
    db.close()
