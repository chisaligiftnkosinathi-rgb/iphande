from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Union
from datetime import datetime


class ProfileCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str] = None
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_is_public: Optional[bool] = False
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    provider_type: Optional[str] = None
    location: Optional[str] = None
    short_bio: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    pricing_style: Optional[str] = None
    availability: Optional[str] = None
    languages: Optional[str] = None
    trust_posture: Optional[str] = None
    logo_url: Optional[str] = None
    company_logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    supporting_image_urls: Optional[Union[List[str], str]] = None
    proof_of_work_items: Optional[str] = None
    owner_id: Optional[str] = None
    setup_fee_required: Optional[float] = 120.0
    setup_fee_status: Optional[str] = "pending"
    setup_fee_proof_url: Optional[str] = None
    setup_fee_paid_at: Optional[datetime] = None
    setup_fee_review_note: Optional[str] = None
    onboarding_completed: Optional[bool] = False
    is_active: Optional[bool] = False
    referred_by_code: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_is_public: Optional[bool] = None
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    provider_type: Optional[str] = None
    location: Optional[str] = None
    short_bio: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    pricing_style: Optional[str] = None
    availability: Optional[str] = None
    languages: Optional[str] = None
    trust_posture: Optional[str] = None
    is_public: Optional[bool] = None
    logo_url: Optional[str] = None
    company_logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    supporting_image_urls: Optional[Union[List[str], str]] = None
    proof_of_work_items: Optional[str] = None
    setup_fee_status: Optional[str] = None
    setup_fee_proof_url: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    is_active: Optional[bool] = None
    referred_by_code: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str]
    created_at: datetime
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    location_is_public: bool
    service_radius_km: Optional[float]
    service_area_notes: Optional[str]

    # V1 Public Visibility Layer
    is_public: bool
    place_id: Optional[str]
    canonical_name: Optional[str]
    province: Optional[str]
    municipality: Optional[str]
    city: Optional[str]
    suburb: Optional[str]
    whatsapp_number: Optional[str] = None
    ward_id: Optional[str] = None
    main_place_id: Optional[str] = None
    sub_place_id: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    pricing_style: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    provider_type: Optional[str] = None
    location: Optional[str] = None
    short_bio: Optional[str] = None
    business_category_key: Optional[str] = None
    availability: Optional[str] = None
    languages: Optional[str] = None
    trust_posture: Optional[str] = None
    logo_url: Optional[str] = None
    company_logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    supporting_image_urls: Optional[Union[List[str], str]] = None
    proof_of_work_items: Optional[str] = None
    owner_id: Optional[str] = None
    setup_fee_required: Optional[float] = None
    setup_fee_status: Optional[str] = None
    setup_fee_proof_url: Optional[str] = None
    setup_fee_paid_at: Optional[datetime] = None
    setup_fee_review_note: Optional[str] = None
    continuity_event_id: Optional[str] = None
    onboarding_completed: Optional[bool] = False
    is_active: Optional[bool] = False
    referral_code: Optional[str] = None
    referred_by_code: Optional[str] = None

    plan_code: Optional[str] = "free"
    subscription_active: Optional[bool] = True
    role: Optional[str] = "steward"
    allowed_features: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_privacy(cls, obj):
        # Only expose lat/lon if location_is_public
        base = cls.model_validate(obj) if hasattr(cls, 'model_validate') else cls.from_orm(obj)
        if not getattr(obj, "location_is_public", False):
            base.latitude = None
            base.longitude = None
        
        from src.models.constants import PLAN_FEATURES
        base.allowed_features = PLAN_FEATURES.get(getattr(obj, "plan_code", "free"), [])
        return base
