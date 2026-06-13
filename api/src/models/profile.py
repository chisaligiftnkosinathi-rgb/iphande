from sqlalchemy import Column, String, DateTime, Float, Boolean, JSON
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

    # V1 Public Visibility Layer
    is_public = Column(Boolean, default=True, nullable=False)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    suburb = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    facebook_page_url = Column(String, nullable=True)
    cover_photo_url = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    supporting_image_urls = Column(JSON, nullable=True, default=list) # Array of up to 5 URLs
    proof_of_work_items = Column(String, nullable=True)  # JSON: [{url, title, completed_date, note}]

    # Business Truthfulness Layer
    provider_type = Column(String, nullable=True)
    location = Column(String, nullable=True)
    short_bio = Column(String, nullable=True)
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

    # V1 Onboarding & Setup Fee
    setup_fee_required = Column(Float, default=120.0, nullable=True)
    setup_fee_status = Column(String, default="pending", nullable=True)
    setup_fee_proof_url = Column(String, nullable=True)
    setup_fee_paid_at = Column(DateTime, nullable=True)
    setup_fee_review_note = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    # Referral Program V1
    referral_code = Column(String, unique=True, nullable=True)
    referred_by_code = Column(String, nullable=True)
