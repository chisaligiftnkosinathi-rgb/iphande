from sqlalchemy import Column, String, Float, JSON, DateTime
import datetime
import uuid
from src.database import Base

class ActivationEvent(Base):
    __tablename__ = "activation_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    payload = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
