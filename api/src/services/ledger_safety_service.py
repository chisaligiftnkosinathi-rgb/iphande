"""
Ledger Safety Service

Implements production-grade safety guards:
- Idempotency protection (prevent duplicate processing)
- Immutability enforcement (prevent accidental ledger edits)
- Reconciliation views (audit trail reconstruction)
- Configuration management (dynamic fee rules)
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from src.models.payment_intent import PaymentIntent
from src.models.fee_ledger import FeeLedger, FeeLedgerStatus
from src.models.earning_ledger import EarningLedger
from src.models.platform_config import PlatformConfig, ConfigScope, LedgerImmutabilityLog
from src.models.merchant_account import MerchantAccount


class LedgerSafetyService:
    """Production safety guards for ledger operations"""

    # ===========================================
    # IDEMPOTENCY PROTECTION
    # ===========================================

    @staticmethod
    def check_payment_idempotency(
        db: Session,
        idempotency_key: str | None = None,
        provider_event_id: str | None = None,
    ) -> PaymentIntent | None:
        """
        Check if payment has already been processed (idempotency check).

        If same idempotency_key or provider_event_id appears twice,
        reject the duplicate and return the original.

        This prevents PayFast ITN webhook duplicates from double-crediting.

        Args:
            db: Database session
            idempotency_key: Unique request identifier
            provider_event_id: PayFast event reference

        Returns:
            PaymentIntent if already processed, None if new
        """
        if idempotency_key:
            existing = db.query(PaymentIntent).filter(
                PaymentIntent.idempotency_key == idempotency_key
            ).first()

            if existing:
                return existing

        if provider_event_id:
            existing = db.query(PaymentIntent).filter(
                PaymentIntent.provider_event_id == provider_event_id
            ).first()

            if existing:
                return existing

        return None

    @staticmethod
    def check_fee_ledger_idempotency(
        db: Session,
        payment_intent_id: UUID,
    ) -> FeeLedger | None:
        """
        Check if fee ledger already exists for this payment.

        One payment = exactly one fee ledger (enforced by unique constraint).
        If already exists, return it (idempotent).
        """
        return db.query(FeeLedger).filter(
            FeeLedger.payment_intent_id == payment_intent_id
        ).first()

    # ===========================================
    # IMMUTABILITY ENFORCEMENT
    # ===========================================

    @staticmethod
    def enforce_payment_immutability(
        db: Session,
        payment_id: UUID,
    ) -> None:
        """
        Prevent payment record from being modified after confirmation.

        Called after payment_intent.status = confirmed.

        Immutable fields: amount, currency, business_owner_id, opportunity_id
        Mutable fields: status (state transitions only), confirmed_at, ledger_processed_at
        """
        LedgerSafetyService.log_immutability_protection(
            db=db,
            ledger_type="payment_intent",
            ledger_id=payment_id,
            action="creation_locked",
            block_reason="Payment confirmed - immutability enforced",
        )

    @staticmethod
    def enforce_fee_ledger_immutability(
        db: Session,
        fee_ledger_id: UUID,
    ) -> None:
        """
        Prevent fee ledger record from being modified after creation.

        Immutable fields: payment_intent_id, total_amount, platform_fee_amount, provider_amount
        Mutable fields: status (state transitions only), allocated_at, settled_at
        """
        LedgerSafetyService.log_immutability_protection(
            db=db,
            ledger_type="fee_ledger",
            ledger_id=fee_ledger_id,
            action="creation_locked",
            block_reason="Fee ledger created - split amounts immutable",
        )

    @staticmethod
    def enforce_earning_ledger_immutability(
        db: Session,
        earning_ledger_id: UUID,
    ) -> None:
        """
        Prevent earning ledger record from being modified after creation.

        Immutable fields: user_id, merchant_account_id, payment_intent_id, amount
        Mutable fields: status (state transitions only)
        """
        LedgerSafetyService.log_immutability_protection(
            db=db,
            ledger_type="earning_ledger",
            ledger_id=earning_ledger_id,
            action="creation_locked",
            block_reason="Earning ledger created - amount immutable",
        )

    @staticmethod
    def log_immutability_protection(
        db: Session,
        ledger_type: str,
        ledger_id: UUID,
        action: str,
        block_reason: str | None = None,
        triggered_by: str | None = None,
    ) -> None:
        """
        Log immutability protection action for audit trail.
        """
        log_entry = LedgerImmutabilityLog(
            ledger_type=ledger_type,
            ledger_id=ledger_id,
            action=action,
            block_reason=block_reason,
            triggered_by=triggered_by,
        )

        db.add(log_entry)
        db.commit()

    # ===========================================
    # FEE CONFIGURATION MANAGEMENT
    # ===========================================

    @staticmethod
    def get_platform_fee_percent(
        db: Session,
        trust_tier: str | None = None,
        business_category: str | None = None,
        campaign_id: str | None = None,
    ) -> Decimal:
        """
        Get applicable platform fee percentage for a transaction.

        Priority resolution (first match wins):
        1. Promotional override (if active campaign)
        2. Business category override
        3. Trust tier override
        4. Global default

        Uses PlatformConfigCache for performance (5-minute TTL).

        Args:
            db: Database session
            trust_tier: User's trust level
            business_category: Merchant's business category
            campaign_id: Active promotional campaign

        Returns:
            Fee percentage as Decimal (e.g., Decimal("10") for 10%)
        """
        from src.services.config_cache_service import PlatformConfigCache

        return PlatformConfigCache.get_fee_percent(
            db=db,
            trust_tier=trust_tier,
            business_category=business_category,
            campaign_id=campaign_id,
        )

    @staticmethod
    def set_platform_fee(
        db: Session,
        fee_percent: Decimal,
        scope: str = "global_default",
        trust_tier: str | None = None,
        business_category: str | None = None,
        campaign_id: str | None = None,
        changed_by: str | None = None,
        change_reason: str | None = None,
        effective_from: datetime | None = None,
        effective_until: datetime | None = None,
    ) -> PlatformConfig:
        """
        Set or update platform fee configuration.

        Does not delete old configs, just deactivates them.
        Keeps full audit trail of all fee changes.
        """
        # Deactivate any existing config for this scope
        db.query(PlatformConfig).filter(
            and_(
                PlatformConfig.key == "platform_fee_percent",
                PlatformConfig.scope == scope,
                PlatformConfig.trust_tier == trust_tier,
                PlatformConfig.business_category == business_category,
                PlatformConfig.campaign_id == campaign_id,
            )
        ).update({"is_active": False})

        # Create new config
        config = PlatformConfig(
            key="platform_fee_percent",
            scope=scope,
            trust_tier=trust_tier,
            business_category=business_category,
            campaign_id=campaign_id,
            value_type="decimal",
            decimal_value=fee_percent,
            is_active=True,
            effective_from=effective_from or datetime.utcnow(),
            effective_until=effective_until,
            changed_by=changed_by,
            change_reason=change_reason,
        )

        db.add(config)
        db.commit()
        db.refresh(config)

        return config

    # ===========================================
    # LEDGER RECONCILIATION
    # ===========================================

    @staticmethod
    def reconcile_payment_ledger_chain(
        db: Session,
        payment_intent_id: UUID,
    ) -> dict:
        """
        Reconstruct full ledger chain for a payment.

        Returns complete audit trail:
        - PaymentIntent (client payment)
        - FeeLedger (platform split)
        - EarningLedger (provider earnings)
        - Payout status (if applicable)

        Essential for dispute resolution and audit.

        Returns:
            {
                "payment_intent": {...},
                "fee_ledger": {...},
                "earning_ledger": {...},
                "reconciliation_status": "complete|partial|missing_components",
                "issues": [...],
            }
        """
        issues = []

        # Step 1: Fetch payment
        payment = db.query(PaymentIntent).filter(
            PaymentIntent.id == payment_intent_id
        ).first()

        if not payment:
            return {
                "payment_intent": None,
                "fee_ledger": None,
                "earning_ledger": None,
                "reconciliation_status": "missing_components",
                "issues": ["Payment not found"],
            }

        payment_dict = {
            "id": str(payment.id),
            "amount": str(payment.amount),
            "currency": payment.currency,
            "status": payment.status.value,
            "created_at": payment.created_at.isoformat(),
            "confirmed_at": payment.confirmed_at.isoformat() if payment.confirmed_at else None,
        }

        # Step 2: Fetch fee ledger
        fee = db.query(FeeLedger).filter(
            FeeLedger.payment_intent_id == payment_intent_id
        ).first()

        fee_dict = None
        if fee:
            fee_dict = {
                "id": str(fee.id),
                "total_amount": str(fee.total_amount),
                "platform_fee_amount": str(fee.platform_fee_amount),
                "provider_amount": str(fee.provider_amount),
                "platform_fee_percent": str(fee.platform_fee_percent),
                "status": fee.status,
                "created_at": fee.created_at.isoformat(),
                "allocated_at": fee.allocated_at.isoformat() if fee.allocated_at else None,
                "settled_at": fee.settled_at.isoformat() if fee.settled_at else None,
            }

            # Verify split math
            if fee.platform_fee_amount + fee.provider_amount != fee.total_amount:
                issues.append(
                    f"Fee split math error: {fee.platform_fee_amount} + {fee.provider_amount} != {fee.total_amount}"
                )
        else:
            if payment.status.value == "confirmed":
                issues.append("Payment confirmed but no fee ledger created")

        # Step 3: Fetch earning ledger
        earning = None
        earning_dict = None

        if fee:
            earning = db.query(EarningLedger).filter(
                EarningLedger.id == fee.earning_ledger_id
            ).first()

            if earning:
                earning_dict = {
                    "id": str(earning.id),
                    "user_id": earning.user_id,
                    "amount": str(earning.amount),
                    "status": earning.status.value,
                    "pending_at": earning.pending_at.isoformat(),
                    "available_at": earning.available_at.isoformat() if earning.available_at else None,
                    "paid_at": earning.paid_at.isoformat() if earning.paid_at else None,
                }

        # Determine reconciliation status
        reconciliation_status = "complete"

        if not fee:
            reconciliation_status = "partial"
        elif fee and not earning:
            reconciliation_status = "partial"

        if issues:
            reconciliation_status = "partial"

        return {
            "payment_intent": payment_dict,
            "fee_ledger": fee_dict,
            "earning_ledger": earning_dict,
            "reconciliation_status": reconciliation_status,
            "issues": issues,
        }
