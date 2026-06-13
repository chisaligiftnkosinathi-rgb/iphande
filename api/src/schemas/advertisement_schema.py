from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class AdvertisementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_key: str
    province: str
    town_or_city: str
    suburb_or_area: Optional[str] = None
    contact_name: str
    contact_whatsapp: str
    price_or_budget: Optional[str] = None
    expires_at: Optional[datetime] = None

class AdvertisementOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    category_key: str
    province: str
    town_or_city: str
    suburb_or_area: Optional[str] = None
    contact_name: str
    contact_whatsapp: str
    price_or_budget: Optional[str] = None
    payment_status: str
    advert_status: str
    payment_reference: Optional[str] = None
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}
