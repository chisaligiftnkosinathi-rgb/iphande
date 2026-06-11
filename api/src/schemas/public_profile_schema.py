from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class PublicProfileOut(BaseModel):
    id: str
    name: str
    slug: str
    phone: Optional[str] = None
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    location_is_public: bool
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None
    created_at: datetime
    provider_type: Optional[str] = None
    location: Optional[str] = None
    short_bio: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    services: Optional[str] = None
    contact_method: Optional[str] = None
    logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    supporting_image_urls: list[str] | str | None = None

    model_config = ConfigDict(from_attributes=True)
