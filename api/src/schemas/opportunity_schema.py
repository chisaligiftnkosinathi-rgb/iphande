from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class OpportunityCreate(BaseModel):
    created_by_profile_id: str
    title: str
    description: Optional[str] = None
    province: str
    town_or_city: str
    suburb_or_area: Optional[str] = None
    category_key: str
    service_needed: str
    budget_amount: Optional[str] = None
    contact_name: str
    contact_phone: str
    image_url_1: Optional[str] = None
    image_url_2: Optional[str] = None
    expiry_date: Optional[datetime] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    province: Optional[str] = None
    town_or_city: Optional[str] = None
    suburb_or_area: Optional[str] = None
    category_key: Optional[str] = None
    service_needed: Optional[str] = None
    budget_amount: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    image_url_1: Optional[str] = None
    image_url_2: Optional[str] = None
    expiry_date: Optional[datetime] = None

class OpportunityOut(BaseModel):
    id: str
    created_by_profile_id: str
    title: str
    description: Optional[str]
    status: str
    province: Optional[str]
    town_or_city: Optional[str]
    suburb_or_area: Optional[str]
    category_key: Optional[str]
    service_needed: Optional[str]
    budget_amount: Optional[str]
    contact_name: Optional[str]
    contact_phone: Optional[str]
    image_url_1: Optional[str]
    image_url_2: Optional[str]
    expiry_date: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
