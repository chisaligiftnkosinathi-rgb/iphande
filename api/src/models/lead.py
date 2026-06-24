from sqlalchemy import Column, String, DateTime, Text
from src.database import Base
from datetime import datetime
import uuid

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, nullable=False, index=True)
    profile_slug = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    service_needed = Column(String, nullable=True)
    customer_location = Column(String, nullable=True)
    status = Column(String, nullable=False, default="new")
    source = Column(String, nullable=False, default="public_profile")
    created_at = Column(DateTime, default=datetime.utcnow)
