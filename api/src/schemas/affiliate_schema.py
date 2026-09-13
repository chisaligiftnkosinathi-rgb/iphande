from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
import uuid


class AffiliateOfferOut(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    category: str
    client_name: str
    channel: Optional[str] = "Web"
    payout_model: str
    base_payout: Decimal
    payout_percentage: Optional[Decimal] = None
    payout_tier_rules: Optional[Any] = None
    merchant_split_ratio: Decimal
    min_income: Optional[Decimal] = None
    min_age: int
    max_age: int
    requires_employment: bool
    requires_bank_account: bool
    requires_sa_citizen: bool
    requires_driver_license: bool
    dedup_period_days: int
    is_active: bool

    class Config:
        from_attributes = True


class AffiliateLeadCreate(BaseModel):
    offer_id: uuid.UUID
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=7, max_length=30)
    email: Optional[str] = Field(None, max_length=150)
    national_id: Optional[str] = Field(None, max_length=30)
    monthly_income: Optional[Decimal] = None
    is_employed: Optional[bool] = None
    has_bank_account: Optional[bool] = None
    is_sa_citizen: Optional[bool] = None
    has_driver_license: Optional[bool] = None
    age: Optional[int] = None
    customer_metadata: Optional[Dict[str, Any]] = None


class AffiliateLeadOut(BaseModel):
    id: uuid.UUID
    offer_id: uuid.UUID
    merchant_id: str
    first_name: str
    last_name: str
    phone_number: str
    email: Optional[str] = None
    national_id: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    is_employed: Optional[bool] = None
    has_bank_account: Optional[bool] = None
    is_sa_citizen: Optional[bool] = None
    has_driver_license: Optional[bool] = None
    age: Optional[int] = None
    status: str
    disqualification_reason: Optional[str] = None
    external_lead_id: Optional[str] = None
    gross_commission: Optional[Decimal] = None
    merchant_commission: Optional[Decimal] = None
    platform_fee: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AffiliateConversionPostback(BaseModel):
    offer_slug: Optional[str] = None
    lead_id: Optional[uuid.UUID] = None
    external_lead_id: Optional[str] = None
    phone_number: Optional[str] = None
    national_id: Optional[str] = None
    status: str = Field(default="CONVERTED")  # CONVERTED or REJECTED
    gross_amount: Optional[Decimal] = None    # Actual sale or commission payout amount if dynamic
    conversion_reference: Optional[str] = None
    conversion_rate: Optional[Decimal] = None # For tiered CR calculations
