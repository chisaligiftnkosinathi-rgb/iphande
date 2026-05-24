from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from src.database import Base
import uuid
from datetime import datetime

class FollowUp(Base):
    __tablename__ = "followups"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id = Column(String, ForeignKey("opportunities.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
