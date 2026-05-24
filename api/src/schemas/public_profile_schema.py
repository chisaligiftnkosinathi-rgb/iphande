from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

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

    model_config = ConfigDict(from_attributes=True)
