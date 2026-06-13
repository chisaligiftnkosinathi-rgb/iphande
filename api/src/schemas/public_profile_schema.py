from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Union

class PublicProfileOut(BaseModel):
    id: str
    name: str
    slug: str
    phone: Optional[str] = None
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    suburb: Optional[str] = None
    location_is_public: Optional[bool] = False
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    provider_type: Optional[str] = None
    location: Optional[str] = None
    short_bio: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    offer_types: Optional[str] = None
    availability: Optional[str] = None
    logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    supporting_image_urls: Optional[Union[List[str], str]] = None
    proof_of_work_items: Optional[str] = None  # JSON: [{url, title, completed_date, note}]
    whatsapp_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('services', mode='before')
    @classmethod
    def clean_services(cls, v: object) -> Optional[str]:
        """Return None for literal string 'None' or empty strings."""
        if v is None or str(v).strip().lower() == 'none' or str(v).strip() == '':
            return None
        return str(v)

    @field_validator('short_bio', mode='before')
    @classmethod
    def clean_short_bio(cls, v: object) -> Optional[str]:
        """Return None for literal string 'None' or empty strings."""
        if v is None or str(v).strip().lower() == 'none' or str(v).strip() == '':
            return None
        return str(v)

    @field_validator('availability', mode='before')
    @classmethod
    def clean_availability(cls, v: object) -> Optional[str]:
        """Return None for literal string 'None' or empty strings."""
        if v is None or str(v).strip().lower() == 'none' or str(v).strip() == '':
            return None
        return str(v)

    @field_validator('proof_of_work_items', mode='before')
    @classmethod
    def clean_pow_items(cls, v: object) -> Optional[str]:
        """Return None for literal string 'None' or empty strings."""
        if v is None or str(v).strip().lower() == 'none' or str(v).strip() == '':
            return None
        return str(v)
