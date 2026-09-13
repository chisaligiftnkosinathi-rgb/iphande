import enum
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Numeric,
    Boolean,
    Integer,
    JSON,
    ForeignKey,
    DateTime,
    Enum,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.database import Base


class PayoutModel(str, enum.Enum):
    CPA = "CPA"
    CPL = "CPL"
    CPS = "CPS"
    TIERED_CPL = "TIERED_CPL"
    HYBRID = "HYBRID"


class LeadStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    QUALIFIED = "QUALIFIED"
    DISPATCHED = "DISPATCHED"
    CONVERTED = "CONVERTED"
    REJECTED = "REJECTED"


class AffiliateOffer(Base):
    __tablename__ = "affiliate_offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    slug = Column(String(80), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    category = Column(String(60), index=True, nullable=False)  # LOANS, FUNERAL, MEDICAL, VEHICLE, RETAIL, INVESTMENTS, DIGITAL_TOOLS, WEALTH_AND_SAVINGS
    client_name = Column(String(100), nullable=False)
    channel = Column(String(100), default="Web")

    # Financial Terms
    payout_model = Column(String(30), nullable=False, default=PayoutModel.CPA.value)
    base_payout = Column(Numeric(10, 2), default=0.00, nullable=False)
    payout_percentage = Column(Numeric(5, 4), nullable=True)  # e.g., 0.025 for 2.5%, 0.10 for HostAfrica
    payout_tier_rules = Column(JSON, nullable=True)           # Dynamic CR% mapping
    merchant_split_ratio = Column(Numeric(4, 2), default=0.70, nullable=False)  # e.g. 0.70 or 0.80

    # Tracking & Deep-Link Reference
    affiliate_base_url = Column(String(255), nullable=True)   # Direct referral link template
    description = Column(Text, nullable=True)                 # Explanatory pitch for entrepreneurs

    # Targeting & Eligibility Spec
    min_income = Column(Numeric(10, 2), nullable=True)
    min_age = Column(Integer, default=18, nullable=False)
    max_age = Column(Integer, default=65, nullable=False)
    requires_employment = Column(Boolean, default=True, nullable=False)
    requires_bank_account = Column(Boolean, default=True, nullable=False)
    requires_sa_citizen = Column(Boolean, default=True, nullable=False)
    requires_driver_license = Column(Boolean, default=False, nullable=False)
    requires_fica = Column(Boolean, default=False, nullable=False)
    dedup_period_days = Column(Integer, default=90, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AffiliateLead(Base):
    __tablename__ = "affiliate_leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    offer_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_offers.id"), nullable=False, index=True)
    merchant_id = Column(String, nullable=False, index=True)  # business_owner_id / profile owner_id

    # Customer Identity & Contact
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(30), nullable=False, index=True)
    email = Column(String(150), nullable=True)
    national_id = Column(String(30), nullable=True, index=True)

    # Lead Profile & Eligibility Attributes
    monthly_income = Column(Numeric(10, 2), nullable=True)
    is_employed = Column(Boolean, nullable=True)
    has_bank_account = Column(Boolean, nullable=True)
    is_sa_citizen = Column(Boolean, nullable=True)
    has_driver_license = Column(Boolean, nullable=True)
    age = Column(Integer, nullable=True)

    # Status & Disposition
    status = Column(String(30), default=LeadStatus.SUBMITTED.value, nullable=False, index=True)
    disqualification_reason = Column(String(255), nullable=True)
    external_lead_id = Column(String(100), nullable=True, index=True)
    customer_metadata = Column(JSON, nullable=True)

    # Commission & Payout Tracking
    converted_at = Column(DateTime(timezone=True), nullable=True)
    gross_commission = Column(Numeric(10, 2), nullable=True)
    merchant_commission = Column(Numeric(10, 2), nullable=True)
    platform_fee = Column(Numeric(10, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_affiliate_leads_offer_phone", "offer_id", "phone_number"),
        Index("ix_affiliate_leads_offer_national_id", "offer_id", "national_id"),
    )


class AffiliateClick(Base):
    __tablename__ = "affiliate_clicks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    offer_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_offers.id"), nullable=False, index=True)
    offer_slug = Column(String(80), nullable=False, index=True)
    merchant_id = Column(String(100), nullable=False, index=True)
    visitor_ip = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    target_url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AffiliatePartnerStatement(Base):
    __tablename__ = "affiliate_partner_statements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    partner = Column(String(80), nullable=False, index=True)  # e.g. HOSTAFRICA, EASYEQUITIES
    reporting_period = Column(String(20), nullable=False)   # e.g. 2026-09
    total_earnings = Column(Numeric(12, 2), nullable=False)
    withdrawn_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_visitors = Column(Integer, default=0, nullable=False)
    new_signups = Column(Integer, default=0, nullable=False)
    payout_account_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
