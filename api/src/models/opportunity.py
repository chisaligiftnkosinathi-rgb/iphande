from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.dialects.sqlite import TEXT
from src.database import Base
import uuid
from datetime import datetime

class Opportunity(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by_profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open") # open, contacted, closed

    province = Column(String, nullable=True)
    town_or_city = Column(String, nullable=True)
    suburb_or_area = Column(String, nullable=True)
    
    latitude = Column('latitude', Float, nullable=True)
    longitude = Column('longitude', Float, nullable=True)
    
    category_key = Column(String, nullable=True)
    service_needed = Column(String, nullable=True)
    budget_amount = Column(String, nullable=True)

    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    image_url_1 = Column(String, nullable=True)
    image_url_2 = Column(String, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
