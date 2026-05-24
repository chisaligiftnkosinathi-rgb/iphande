from sqlalchemy import Column, String, DateTime
from src.database import Base
import uuid
from datetime import datetime

class Reflection(Base):
    __tablename__ = "reflections"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_profile_id = Column(String, nullable=False)
    reflection_date = Column(DateTime, nullable=False)
    wins = Column(String, nullable=False)
    challenges = Column(String, nullable=False)
    lessons = Column(String, nullable=False)
    tomorrow_focus = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
