"""
Dashboard Aggregation Schema

Projection of multiple domains into a unified steward business snapshot.
This is a BFF (Backend-for-Frontend) layer that responds to mobile UI needs
while keeping underlying domain services independent.

Key principle: Every section follows the same envelope pattern
to make frontend error handling and partial data rendering trivial.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field


# ===========================================
# SECTION ENVELOPE
# ===========================================

class DashboardSectionStatus(str, Enum):
    """Status of a dashboard section"""
    ok = "ok"
    error = "error"
    loading = "loading"


T = TypeVar("T")


class DashboardSection(BaseModel, Generic[T]):
    """
    Generic envelope for any dashboard section.

    Guarantees:
    - If status="ok", data is not None
    - If status="error", error is not None
    - If status="loading", both data and error are None

    This makes frontend rendering extremely simple:

        const isLoading = section.status === 'loading'
        const hasError = section.status === 'error'
        const hasData = section.status === 'ok'
    """
    status: DashboardSectionStatus
    data: Optional[T] = None
    error: Optional[str] = None


# ===========================================
# MERCHANT SECTION
# ===========================================

class MerchantInfo(BaseModel):
    """Steward's merchant account identity and status"""
    id: UUID
    user_id: str
    account_holder_name: str
    verification_status: str  # "unverified" | "verified" | "rejected"
    payout_enabled: bool
    bank_name: str
    account_type: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# ===========================================
# TRUST SECTION
# ===========================================

class TrustScoreInfo(BaseModel):
    """Trust score breakdown"""
    overall_score: int
    identity_score: int = 0
    proof_score: int = 0
    economic_score: int = 0
    activity_score: int = 0
    visibility_score: int
    work_proof_count: int = 0
    opportunity_completion_rate: float = 0.0

    class Config:
        from_attributes = True


class VisibilityInfo(BaseModel):
    """Profile visibility status"""
    visibility_state: Optional[str] = None  # "new", "emerging", "trusted", etc.
    visibility_score: int
    is_verified: bool = False

    class Config:
        from_attributes = True


class TrustInfo(BaseModel):
    """Unified trust snapshot"""
    score: TrustScoreInfo
    visibility: VisibilityInfo
    verification_required: bool


# ===========================================
# WALLET SECTION
# ===========================================

class WalletInfo(BaseModel):
    """Financial summary"""
    pending_amount: Decimal
    available_amount: Decimal
    paid_amount: Decimal
    currency: str = "ZAR"
    last_updated: datetime

    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}


# ===========================================
# OPPORTUNITIES SECTION
# ===========================================

class OpportunitiesInfo(BaseModel):
    """Work and opportunity summary"""
    total_available: int = 0
    active_jobs: int = 0
    pending_proof_count: int = 0
    completed_today: int = 0

    class Config:
        from_attributes = True


# ===========================================
# NOTIFICATIONS SECTION
# ===========================================

class NotificationInfo(BaseModel):
    """Notification summary"""
    total_unread: int = 0
    has_unread_payment: bool = False
    has_unread_proof: bool = False

    class Config:
        from_attributes = True


# ===========================================
# PLATFORM SECTION
# ===========================================

class PlatformInfo(BaseModel):
    """Platform status and metadata"""
    version: str = "1.0.0"
    maintenance: bool = False
    api_healthy: bool = True
    minimum_app_version: Optional[str] = None
    feature_flags: dict = Field(default_factory=dict)
    announcements: list[str] = Field(default_factory=list)


# ===========================================
# COMPLETE RESPONSE
# ===========================================

class DashboardResponse(BaseModel):
    """
    Complete steward dashboard response.

    Aggregates merchant, trust, financial, and operational data
    into a single payload optimized for the mobile app's dashboard screen.

    Response contract:
    - schema_version: Bump when response shape changes (for migrations)
    - timestamp: When snapshot was captured (UTC)
    - generated_in_ms: Latency for performance monitoring

    Each section is wrapped in DashboardSection envelope for graceful degradation.
    If merchant service fails, trust/wallet/etc. still render.
    """

    schema_version: int = Field(default=1, description="Increment when response structure changes")
    timestamp: datetime = Field(description="When this snapshot was generated")
    generated_in_ms: float = Field(description="Backend latency in milliseconds")

    merchant: DashboardSection[MerchantInfo]
    trust: DashboardSection[TrustInfo]
    wallet: DashboardSection[WalletInfo]
    opportunities: DashboardSection[OpportunitiesInfo]
    notifications: DashboardSection[NotificationInfo]
    platform: DashboardSection[PlatformInfo]


# ===========================================
# ERROR SECTION (for failed sections)
# ===========================================

def create_error_section(
    error_message: str
) -> DashboardSection:
    """
    Create an error section.

    Usage:
        section = create_error_section("Wallet service temporarily unavailable")
    """
    return DashboardSection(
        status=DashboardSectionStatus.error,
        error=error_message,
        data=None
    )


def create_ok_section(data: T) -> DashboardSection[T]:
    """
    Create a successful section.

    Usage:
        merchant_section = create_ok_section(merchant_info)
    """
    return DashboardSection(
        status=DashboardSectionStatus.ok,
        data=data,
        error=None
    )


def create_loading_section() -> DashboardSection:
    """
    Create a loading section.

    Used for sections that are being fetched.
    """
    return DashboardSection(
        status=DashboardSectionStatus.loading,
        data=None,
        error=None
    )
