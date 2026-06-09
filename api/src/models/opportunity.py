from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.sqlite import TEXT
from src.database import Base
import uuid
from datetime import datetime

class Opportunity(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open")

    # V1 Public Visibility Grouping
    archetype = Column(String, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    suburb = Column(String, nullable=True)
    location_name = Column(String, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    public_contact_whatsapp = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
