from sqlalchemy import Column, String, DateTime, Float, Boolean
from sqlalchemy.dialects.sqlite import TEXT
from src.database import Base
import uuid
from datetime import datetime

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Location fields
    operating_area = Column(String, nullable=True)
    address_label = Column(String, nullable=True)
    latitude = Column('latitude',  Float, nullable=True)
    longitude = Column('longitude', Float, nullable=True)
    location_is_public = Column('location_is_public',  Boolean, nullable=False, default=False)
    service_radius_km = Column('service_radius_km', Float, nullable=True)
    service_area_notes = Column(String, nullable=True)

    # Business Truthfulness Layer
    business_category_key = Column(String, nullable=True)
    business_line = Column(String, nullable=True)
    services = Column(String, nullable=True)
    contact_method = Column(String, nullable=True)
    offer_types = Column(String, nullable=True)
    pricing_style = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    trust_posture = Column(String, nullable=True)

    continuity_event_id = Column(String, nullable=True)
    owner_id = Column(String, nullable=True)
