from sqlalchemy import Column, String, DateTime, Boolean
from src.database import Base
import uuid
from datetime import datetime

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_profile_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    body = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    continuity_event_id = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=True)
