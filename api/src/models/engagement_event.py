from sqlalchemy import Column, String, Float, JSON, DateTime
import datetime
import uuid
from src.database import Base

class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False) # e.g. MATCH_READY, OPPORTUNITY_NEARBY

    actor_id = Column(String, nullable=False)
    target_id = Column(String, nullable=False)

    context = Column(JSON, nullable=True)

    urgency_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    distance_km = Column(Float, default=9999.0)

    suggested_actions = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
