from sqlalchemy import Column, String, DateTime, Date
from src.database import Base
import uuid
from datetime import datetime

class ScriptureReflection(Base):
    __tablename__ = "scripture_reflections"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_profile_id = Column(String, nullable=False)
    reflection_date = Column(Date, nullable=False)
    situation_key = Column(String, nullable=False)
    scripture_reference = Column(String, nullable=False)
    scripture_text = Column(String, nullable=False)
    encouragement_note = Column(String, nullable=False)
    linked_reflection_id = Column(String, nullable=True)
    linked_opportunity_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
