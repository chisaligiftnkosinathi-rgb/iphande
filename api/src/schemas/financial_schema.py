from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from src.models.merchant_account import MerchantVerificationStatus
from src.models.earning_ledger import EarningLedgerStatus
from src.models.fee_ledger import FeeLedgerStatus


# ===========================================
# MERCHANT ACCOUNT SCHEMAS
# ===========================================

class MerchantAccountCreate(BaseModel):
    """Input for creating a merchant account"""
    user_id: str
    bank_name: str
    account_holder_name: str
    account_number: str
    branch_code: str
    account_type: str = "Cheque"
    minimum_balance_for_payout: Decimal = Decimal("0")


class MerchantAccountUpdate(BaseModel):
    """Input for updating merchant account"""
    bank_name: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    branch_code: Optional[str] = None
    account_type: Optional[str] = None
    minimum_balance_for_payout: Optional[Decimal] = None


class MerchantAccountVerify(BaseModel):
    """Input for verifying a merchant account"""
    verification_status: MerchantVerificationStatus
    verified_by: str
    suspension_reason: Optional[str] = None


class MerchantAccountOut(BaseModel):
    """Output schema for merchant account"""
    id: UUID
    user_id: str
    bank_name: str
    account_holder_name: str
    account_number: str
    branch_code: str
    account_type: str
    verification_status: MerchantVerificationStatus
    verification_timestamp: Optional[datetime] = None
    verified_by: Optional[str] = None
    is_active: bool
    payout_enabled: bool
    minimum_balance_for_payout: Decimal
    created_at: datetime
    updated_at: datetime
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None

    model_config = {"from_attributes": True}


# ===========================================
# EARNING LEDGER SCHEMAS
# ===========================================

class EarningLedgerCreate(BaseModel):
    """Input for creating an earning ledger entry"""
    user_id: str
    merchant_account_id: UUID
    payment_intent_id: UUID
    opportunity_id: Optional[str] = None
    amount: Decimal
    currency: str = "ZAR"
    notes: Optional[str] = None


class EarningLedgerStatusUpdate(BaseModel):
    """Input for updating earning ledger status"""
    status: EarningLedgerStatus
    payout_batch_id: Optional[UUID] = None
    payout_request_id: Optional[UUID] = None
    reversal_reason: Optional[str] = None
    reversal_triggered_by: Optional[str] = None
    reversal_notes: Optional[str] = None
    status_change_continuity_event_id: Optional[UUID] = None


class EarningLedgerOut(BaseModel):
    """Output schema for earning ledger entry"""
    id: UUID
    user_id: str
    merchant_account_id: UUID
    payment_intent_id: UUID
    opportunity_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: EarningLedgerStatus
    pending_at: datetime
    available_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    reversed_at: Optional[datetime] = None
    payout_batch_id: Optional[UUID] = None
    payout_request_id: Optional[UUID] = None
    reversal_reason: Optional[str] = None
    reversal_triggered_by: Optional[str] = None
    reversal_notes: Optional[str] = None
    created_continuity_event_id: Optional[UUID] = None
    status_change_continuity_event_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ===========================================
# AGGREGATED VIEWS (FOR API RESPONSES)
# ===========================================

class UserEarningsSummary(BaseModel):
    """Summary of user's earnings and payout status"""
    user_id: str
    merchant_account: Optional[MerchantAccountOut] = None
    total_earned: Decimal = Decimal("0")
    pending_amount: Decimal = Decimal("0")
    available_amount: Decimal = Decimal("0")
    paid_amount: Decimal = Decimal("0")
    reversed_amount: Decimal = Decimal("0")
    is_payout_eligible: bool = False
    last_payout_at: Optional[datetime] = None


# ===========================================
# FEE LEDGER SCHEMAS
# ===========================================

class FeeLedgerCreate(BaseModel):
    """Input for creating a fee ledger entry"""
    payment_intent_id: UUID
    total_amount: Decimal
    currency: str = "ZAR"
    platform_fee_percent: Decimal = Decimal("10")  # Default 10%
    platform_account_name: str = "GLOBAL_IT_BUSINESS_SOLUTIONS"


class FeeLedgerOut(BaseModel):
    """Output schema for fee ledger"""
    id: UUID
    payment_intent_id: UUID
    total_amount: Decimal
    currency: str
    platform_fee_percent: Decimal
    platform_fee_amount: Decimal
    provider_amount: Decimal
    platform_account_name: str
    status: str
    created_at: datetime
    allocated_at: Optional[datetime] = None
    settled_at: Optional[datetime] = None
    earning_ledger_id: Optional[UUID] = None
    treasury_transaction_id: Optional[UUID] = None
    fee_allocation_continuity_event_id: Optional[UUID] = None
    notes: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeeSplitSummary(BaseModel):
    """Summary of how a payment is split"""
    payment_intent_id: UUID
    total_amount: Decimal
    platform_fee_amount: Decimal
    provider_amount: Decimal
    platform_fee_percent: Decimal
    platform_account_name: str


# ===========================================
# PLATFORM CONFIG SCHEMAS
# ===========================================

class PlatformConfigOut(BaseModel):
    """Output schema for platform configuration"""
    id: UUID
    key: str
    scope: str
    trust_tier: Optional[str] = None
    business_category: Optional[str] = None
    campaign_id: Optional[str] = None
    value_type: str
    decimal_value: Optional[Decimal] = None
    integer_value: Optional[str] = None
    string_value: Optional[str] = None
    boolean_value: Optional[bool] = None
    json_value: Optional[dict] = None
    is_active: bool
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    description: Optional[str] = None
    changed_by: Optional[str] = None
    change_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ===========================================
# LEDGER RECONCILIATION SCHEMAS
# ===========================================

class PaymentIntentReconciliation(BaseModel):
    """Payment intent reconciliation record"""
    id: str
    amount: str
    currency: str
    status: str
    created_at: str
    confirmed_at: Optional[str] = None


class FeeLedgerReconciliation(BaseModel):
    """Fee ledger reconciliation record"""
    id: str
    total_amount: str
    platform_fee_amount: str
    provider_amount: str
    platform_fee_percent: str
    status: str
    created_at: str
    allocated_at: Optional[str] = None
    settled_at: Optional[str] = None


class EarningLedgerReconciliation(BaseModel):
    """Earning ledger reconciliation record"""
    id: str
    user_id: str
    amount: str
    status: str
    pending_at: str
    available_at: Optional[str] = None
    paid_at: Optional[str] = None


class LedgerReconciliationReport(BaseModel):
    """
    Full ledger reconciliation report.

    Shows complete payment → fee → earnings flow for audit and dispute resolution.
    """
    payment_intent: Optional[PaymentIntentReconciliation] = None
    fee_ledger: Optional[FeeLedgerReconciliation] = None
    earning_ledger: Optional[EarningLedgerReconciliation] = None
    reconciliation_status: str  # "complete", "partial", "missing_components"
    issues: list[str] = []
