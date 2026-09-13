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
    affiliate_base_url: Optional[str] = None
    description: Optional[str] = None
    min_income: Optional[Decimal] = None
    min_age: int
    max_age: int
    requires_employment: bool
    requires_bank_account: bool
    requires_sa_citizen: bool
    requires_driver_license: bool
    requires_fica: bool = False
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


class AffiliateClickOut(BaseModel):
    id: uuid.UUID
    offer_slug: str
    merchant_id: str
    target_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class AffiliateStatementIngest(BaseModel):
    partner: str = Field(..., description="e.g. HOSTAFRICA, EASYEQUITIES")
    reporting_period: str = Field(..., description="e.g. 2026-09")
    total_earnings: Decimal = Field(..., ge=0, description="Total statement earnings, e.g. 500.00")
    withdrawn_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    total_visitors: int = Field(default=0, ge=0)
    new_signups: int = Field(default=0, ge=0)
    payout_account_id: Optional[str] = Field(None, description="Receiving bank or payout account reference")
    notes: Optional[str] = None


class AffiliateStatementOut(BaseModel):
    id: uuid.UUID
    partner: str
    reporting_period: str
    total_earnings: Decimal
    withdrawn_amount: Decimal
    total_visitors: int
    new_signups: int
    payout_account_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleFunnelLeadCreate(BaseModel):
    """
    Comprehensive car buyer acquisition payload:
    Captures primary Mad Cars inquiry and triggers automated fanout to ancillary insurance & telematics.
    """
    full_name: str = Field(..., min_length=2, max_length=150)
    phone_number: str = Field(..., min_length=7, max_length=30)
    national_id: str = Field(..., min_length=10, max_length=30)
    monthly_income: Decimal = Field(..., ge=0, description="Gross monthly income in ZAR")
    has_valid_license: bool = Field(..., description="Must have valid Code B / EB driver's license")
    preferred_vehicle_type: str = Field(default="Hatchback", description="Hatchback, Sedan, Bakkie, SUV")
    target_budget_range: str = Field(default="R3,000 - R5,000/pm", description="Target monthly installment range")
    email: Optional[str] = None
    age: Optional[int] = Field(default=30, ge=18, le=75)
    is_employed: bool = Field(default=True)
    has_bank_account: bool = Field(default=True)
    is_sa_citizen: bool = Field(default=True)
    opt_in_insurance_quote: bool = Field(default=True, description="Fanout to White Label Car Insurance (R70 CPL)")
    opt_in_tracker: bool = Field(default=True, description="Fanout to Vehicle Tracker (R50 CPL)")
    opt_in_dashcam: bool = Field(default=False, description="Fanout to Cartrack Dashcam (R55 CPL)")
    opt_in_warranty: bool = Field(default=False, description="Fanout to Motor Warranty (R50 CPL)")


class VehicleFunnelLeadOut(BaseModel):
    primary_lead: AffiliateLeadOut
    ancillary_leads: List[AffiliateLeadOut] = []
    total_potential_commission: Decimal
    merchant_potential_share: Decimal
    dispatch_status: str
    message: str
