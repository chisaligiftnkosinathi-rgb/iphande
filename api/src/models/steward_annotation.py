import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text
from src.database import Base


class StewardAnnotation(Base):
    __tablename__ = "steward_annotations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    target_event_id = Column(String, nullable=False, index=True)
    steward_id = Column(String, nullable=False, index=True)
    annotation_type = Column(String, nullable=False, default="context")
    body = Column(Text, nullable=False)
    visibility = Column(String, nullable=False, default="bounded")
    continuity_event_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
