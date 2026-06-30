"""
Dashboard Service Layer

Aggregates merchant, trust, financial, and operational data
into a unified steward business snapshot.

Principles:
- Call domain services directly (not HTTP endpoints)
- Parallel fetching where possible
- Graceful error handling (one failure ≠ 500 error)
- Reusable for other UIs (web dashboard, admin console, etc.)
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from src.schemas.dashboard_schema import (
    DashboardResponse,
    DashboardSection,
    DashboardSectionStatus,
    MerchantInfo,
    TrustInfo,
    TrustScoreInfo,
    VisibilityInfo,
    WalletInfo,
    OpportunitiesInfo,
    NotificationInfo,
    PlatformInfo,
    create_ok_section,
    create_error_section,
)
from src.services.earnings_service import EarningsService
from src.services.trust_engine import update_trust_score
from src.models.merchant_account import MerchantAccount
from src.models.trust_score import TrustScore
from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
from src.models.profile import Profile

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for building steward dashboard response"""

    # ===========================================
    # MERCHANT SECTION
    # ===========================================

    @staticmethod
    def fetch_merchant_section(db: Session, user_id: str) -> DashboardSection[MerchantInfo]:
        """
        Fetch merchant account information.

        Returns error section if account doesn't exist or service fails.
        """
        try:
            merchant = EarningsService.get_merchant_account(db, user_id)

            if not merchant:
                return create_error_section("No merchant account found. Create one to get started.")

            merchant_info = MerchantInfo(
                id=merchant.id,
                user_id=merchant.user_id,
                account_holder_name=merchant.account_holder_name,
                verification_status=merchant.verification_status.value,
                payout_enabled=merchant.payout_enabled,
                bank_name=merchant.bank_name,
                account_type=merchant.account_type,
                created_at=merchant.created_at,
                is_active=merchant.is_active,
            )

            return create_ok_section(merchant_info)

        except Exception as e:
            error_msg = f"Failed to load merchant account: {str(e)}"
            logger.exception(f"Merchant section error for user {user_id}: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # TRUST SECTION
    # ===========================================

    @staticmethod
    def fetch_trust_section(db: Session, user_id: str) -> DashboardSection[TrustInfo]:
        """
        Fetch trust score and visibility status.

        Recalculates trust if needed, then returns current state.
        """
        try:
            # Get user profile
            profile = db.query(Profile).filter(Profile.user_id == user_id).first()
            if not profile:
                return create_error_section("Profile not found")

            # Recalculate trust (updates TrustScore record)
            update_trust_score(db, profile.id)
            db.commit()

            # Fetch the updated trust score
            trust_record = db.query(TrustScore).filter(
                TrustScore.profile_id == profile.id
            ).first()

            if not trust_record:
                return create_error_section("Trust score not available")

            # Build score info
            score_info = TrustScoreInfo(
                overall_score=trust_record.visibility_score,
                visibility_score=trust_record.visibility_score,
                work_proof_count=trust_record.work_proof_count,
                opportunity_completion_rate=trust_record.opportunity_completion_rate,
            )

            # Build visibility info
            visibility_info = VisibilityInfo(
                visibility_state=profile.visibility_state,
                visibility_score=trust_record.visibility_score,
                is_verified=profile.is_verified if hasattr(profile, "is_verified") else False,
            )

            trust_info = TrustInfo(
                score=score_info,
                visibility=visibility_info,
                verification_required=trust_record.visibility_score < 50,
            )

            return create_ok_section(trust_info)

        except Exception as e:
            error_msg = f"Failed to load trust information: {str(e)}"
            logger.exception(f"Trust section error for user {user_id}: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # WALLET SECTION
    # ===========================================

    @staticmethod
    def fetch_wallet_section(db: Session, user_id: str) -> DashboardSection[WalletInfo]:
        """
        Fetch wallet summary (pending, available, paid amounts).

        Uses earning ledger to calculate totals.
        """
        try:
            # Sum earnings by status
            earnings = db.query(EarningLedger).filter(
                EarningLedger.user_id == user_id
            ).all()

            pending = sum(
                e.amount for e in earnings
                if e.status == EarningLedgerStatus.pending
            ) if earnings else Decimal("0")

            available = sum(
                e.amount for e in earnings
                if e.status == EarningLedgerStatus.available
            ) if earnings else Decimal("0")

            paid = sum(
                e.amount for e in earnings
                if e.status == EarningLedgerStatus.paid
            ) if earnings else Decimal("0")

            wallet_info = WalletInfo(
                pending_amount=pending,
                available_amount=available,
                paid_amount=paid,
                currency="ZAR",
                last_updated=datetime.utcnow(),
            )

            return create_ok_section(wallet_info)

        except Exception as e:
            error_msg = f"Failed to load wallet information: {str(e)}"
            logger.exception(f"Wallet section error for user {user_id}: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # OPPORTUNITIES SECTION
    # ===========================================

    @staticmethod
    def fetch_opportunities_section(db: Session, user_id: str) -> DashboardSection[OpportunitiesInfo]:
        """
        Fetch work and opportunity summary.

        Placeholder for Chunk 6 integration.
        """
        try:
            # For now, return zeros
            # Will be connected to OpportunityService in Chunk 6
            opportunities_info = OpportunitiesInfo(
                total_available=0,
                active_jobs=0,
                pending_proof_count=0,
                completed_today=0,
            )

            return create_ok_section(opportunities_info)

        except Exception as e:
            error_msg = f"Failed to load opportunities: {str(e)}"
            logger.exception(f"Opportunities section error for user {user_id}: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # NOTIFICATIONS SECTION
    # ===========================================

    @staticmethod
    def fetch_notifications_section(db: Session, user_id: str) -> DashboardSection[NotificationInfo]:
        """
        Fetch notification summary.

        Placeholder for notification service integration.
        """
        try:
            # For now, return empty
            # Will be connected to NotificationService
            notifications_info = NotificationInfo(
                total_unread=0,
                has_unread_payment=False,
                has_unread_proof=False,
            )

            return create_ok_section(notifications_info)

        except Exception as e:
            error_msg = f"Failed to load notifications: {str(e)}"
            logger.exception(f"Notifications section error for user {user_id}: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # PLATFORM SECTION
    # ===========================================

    @staticmethod
    def fetch_platform_section() -> DashboardSection[PlatformInfo]:
        """
        Fetch platform status and metadata.

        Used for version checks, maintenance mode, feature flags, etc.
        """
        try:
            platform_info = PlatformInfo(
                version="1.0.0",
                maintenance=False,
                api_healthy=True,
                minimum_app_version=None,
                feature_flags={},
                announcements=[],
            )

            return create_ok_section(platform_info)

        except Exception as e:
            error_msg = f"Failed to load platform information: {str(e)}"
            logger.exception(f"Platform section error: {error_msg}")
            return create_error_section(error_msg)

    # ===========================================
    # AGGREGATION
    # ===========================================

    @staticmethod
    def build_dashboard(db: Session, user_id: str) -> DashboardResponse:
        """
        Build complete dashboard response.

        Fetches all sections, handling errors gracefully.
        If merchant service fails, wallet still fetches.
        If trust service fails, notifications still show.

        Returns response with generated_in_ms populated externally by route handler.
        """
        # Fetch all sections
        # Note: In a high-concurrency scenario, these could be parallelized
        # with asyncio.gather() or similar, but since we're calling
        # synchronous database services, we fetch sequentially for now.

        merchant_section = DashboardService.fetch_merchant_section(db, user_id)
        trust_section = DashboardService.fetch_trust_section(db, user_id)
        wallet_section = DashboardService.fetch_wallet_section(db, user_id)
        opportunities_section = DashboardService.fetch_opportunities_section(db, user_id)
        notifications_section = DashboardService.fetch_notifications_section(db, user_id)
        platform_section = DashboardService.fetch_platform_section()

        # Build response
        response = DashboardResponse(
            schema_version=1,
            timestamp=datetime.utcnow(),
            generated_in_ms=0.0,  # Set by route handler
            merchant=merchant_section,
            trust=trust_section,
            wallet=wallet_section,
            opportunities=opportunities_section,
            notifications=notifications_section,
            platform=platform_section,
        )

        return response
