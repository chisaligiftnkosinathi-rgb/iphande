
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from src.models.quote_request_model import QuoteRequestStatus

class QuoteRequestCreate(BaseModel):
    business_owner_id: str
    business_category_key: str
    business_line: str
    post_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_location: Optional[str] = None
    service_needed: Optional[str] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None

class QuoteRequestOut(BaseModel):
    id: UUID
    business_owner_id: str
    business_category_key: str
    business_line: str
    post_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_location: Optional[str] = None
    service_needed: Optional[str] = None
    preferred_date: Optional[str] = None
    message: Optional[str] = None
    status: QuoteRequestStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    model_config = {"from_attributes": True}

class QuoteRequestStatusUpdate(BaseModel):
    status: QuoteRequestStatus
