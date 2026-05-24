from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from src.database import Base

class GivingStatus(enum.Enum):
    pledged = "pledged"
    received = "received"
    cancelled = "cancelled"

class Giving(Base):
    __tablename__ = "giving"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=True)
    business_owner_id = Column(String, nullable=True)
    business_category_key = Column(String, nullable=True)
    business_line = Column(String, nullable=True)
    trigger_type = Column(String, nullable=True)
    trigger_count = Column(Integer, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    message = Column(String, nullable=True)
    is_voluntary = Column(Boolean, default=True, nullable=False)
    status = Column(Enum(GivingStatus), default=GivingStatus.pledged, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
