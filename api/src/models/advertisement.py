import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base

class Advertisement(Base):
    __tablename__ = "advertisements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category_key = Column(String, nullable=False)
    province = Column(String, nullable=False)
    town_or_city = Column(String, nullable=False)
    suburb_or_area = Column(String, nullable=True)
    contact_name = Column(String, nullable=False)
    contact_whatsapp = Column(String, nullable=False)
    price_or_budget = Column(String, nullable=True)
    payment_status = Column(String, nullable=False, default="pending") # pending | paid | rejected
    advert_status = Column(String, nullable=False, default="pending_review") # pending_review | active | expired | rejected
    payment_reference = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    image_url = Column(String, nullable=True)
