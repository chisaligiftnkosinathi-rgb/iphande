import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models.continuity_event_model import ContinuityEvent
from src.services.transition_audit_service import audit_transition

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

def test_audit_transition_records_rejection_and_raises():
    db = TestingSessionLocal()
    try:
        with pytest.raises(ValueError, match="Invalid Quote transition: draft -> accepted"):
            audit_transition(db, "owner-123", "Quote", "q-123", "draft", "accepted")

        events = db.query(ContinuityEvent).order_by(ContinuityEvent.lineage_sequence.asc()).all()
        # Should immediately persist attempt and rejection despite no parent transaction commit
        assert len(events) == 2
        assert events[0].event_type == "state_transition_attempted"
        assert events[1].event_type == "state_transition_rejected"
        assert events[1].payload_json["reason"] == "Invalid Quote transition: draft -> accepted"
    finally:
        db.close()
