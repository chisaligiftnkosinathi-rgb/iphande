from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class GivingStatus(str, Enum):
    pledged = "pledged"
    received = "received"
    cancelled = "cancelled"

class GivingBase(BaseModel):
    user_id: Optional[str] = None
    business_owner_id: Optional[str] = None
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    trigger_type: Optional[str] = None
    trigger_count: Optional[int] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    message: Optional[str] = None
    is_voluntary: bool = True

    model_config = {"from_attributes": True}

class GivingCreate(GivingBase):
    pass

class Giving(GivingBase):
    id: UUID
    status: GivingStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

class GivingStatusUpdate(BaseModel):
    status: GivingStatus
