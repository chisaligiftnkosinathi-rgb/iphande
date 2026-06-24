from sqlalchemy import Column, String, Integer, JSON, DateTime
import datetime
import uuid
from src.database import Base

class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, nullable=False)
    action_packet_id = Column(String, nullable=False)
    engagement_event_id = Column(String, nullable=True)

    event_type = Column(String, nullable=False) # "VIEWED" | "DISMISSED" | "CLICKED" | "NAVIGATED" | "CONVERTED"

    dwell_time_seconds = Column(Integer, nullable=True)

    context = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
