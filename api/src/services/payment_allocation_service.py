"""
Payment Allocation Service

Handles the atomic transaction processing of confirmed payments into
financial ledgers:
- FeeLedger (fee split)
- TreasuryLedger (platform revenue)
- EarningLedger (provider earnings)

Critical: All ledger creation MUST happen in a single atomic transaction.
If any step fails, everything rolls back. No orphaned records.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from src.database import replay_transaction
from src.models.payment_intent import PaymentIntent
from src.models.fee_ledger import FeeLedger, FeeLedgerStatus
from src.models.treasury_ledger import TreasuryLedger, TreasuryLedgerStatus, TreasuryEntryType
from src.models.earning_ledger import EarningLedger
from src.services.earnings_service import EarningsService
from src.services.fee_service import FeeService
from src.services.ledger_safety_service import LedgerSafetyService
from src.services.continuity_event_service import emit_continuity_event


class PaymentAllocationService:
    """
    Atomically allocates confirmed payments into financial ledgers.

    Guarantees:
    - All ledgers created together or not at all (atomicity)
    - No duplicate ledger entries (idempotency)
    - Immutability enforced after creation (safety)
    - Complete audit trail via continuity events
    """

    @staticmethod
    def allocate_confirmed_payment(
        db: Session,
        payment_intent_id: UUID,
        provider_user_id: str,
        merchant_account_id: UUID,
        opportunity_id: str | None = None,
        provider_event_id: str | None = None,
    ) -> dict:
        """
        Atomically allocate a confirmed payment into:
        1. FeeLedger (fee split)
        2. TreasuryLedger (platform revenue)
        3. EarningLedger (provider earnings)
        4. Continuity events for audit trail

        All components created in single transaction.
        If any step fails: entire transaction rolls back.

        Args:
            db: Database session
            payment_intent_id: Confirmed PaymentIntent to allocate
            provider_user_id: User ID of service provider earning from this
            merchant_account_id: Provider's merchant account for payout
            opportunity_id: Optional opportunity reference
            provider_event_id: PayFast event ID (for idempotency)

        Returns:
            {
                "fee_ledger_id": UUID,
                "treasury_ledger_id": UUID,
                "earning_ledger_id": UUID,
                "payment_intent_id": UUID,
                "status": "allocated",
                "total_allocated": Decimal,
                "platform_fee": Decimal,
                "provider_earnings": Decimal,
            }

        Raises:
            ValueError: If payment not confirmed, ledgers already exist, etc.
        """
        # ===== VALIDATION =====
        payment = db.query(PaymentIntent).filter(
            PaymentIntent.id == payment_intent_id
        ).first()

        if not payment:
            raise ValueError(f"PaymentIntent {payment_intent_id} not found")

        if payment.status.value != "confirmed":
            raise ValueError(
                f"Payment must be confirmed before allocation. Current: {payment.status.value}"
            )

        # ===== ATOMIC TRANSACTION BOUNDARY =====
        # All ledger creation happens here, all-or-nothing
        with replay_transaction(db):
            # Step 1: Check idempotency (payment already allocated?)
            existing_fee = db.query(FeeLedger).filter(
                FeeLedger.payment_intent_id == payment_intent_id
            ).first()

            if existing_fee:
                raise ValueError(
                    f"Payment already allocated (FeeLedger {existing_fee.id} exists)"
                )

            # Step 2: Create FeeLedger (splits fees)
            platform_fee_percent = LedgerSafetyService.get_platform_fee_percent(
                db=db,
                trust_tier=None,  # TODO: derive from provider profile
                business_category=None,  # TODO: derive from opportunity
                campaign_id=None,  # TODO: check for active campaigns
            )

            fee_ledger, earning_ledger = EarningsService.process_payment_split(
                db=db,
                payment_intent_id=payment_intent_id,
                provider_user_id=provider_user_id,
                merchant_account_id=merchant_account_id,
                opportunity_id=opportunity_id,
                platform_fee_percent=platform_fee_percent,
            )

            # Step 3: Create TreasuryLedger (platform revenue)
            treasury_ledger = TreasuryLedger(
                payment_intent_id=payment_intent_id,
                fee_ledger_id=fee_ledger.id,
                amount=fee_ledger.platform_fee_amount,
                currency=payment.currency,
                entry_type=TreasuryEntryType.platform_fee,
                owner="GLOBAL_IT_BUSINESS_SOLUTIONS",
                status=TreasuryLedgerStatus.created,
                provider_event_id=provider_event_id,
            )

            # Emit continuity event for treasury entry
            treasury_event = emit_continuity_event(
                db=db,
                business_owner_id=payment.business_owner_id,
                business_category_key=None,
                business_line=None,
                event_type="treasury_entry_created",
                actor_type="system",
                actor_id="payment_allocation",
                related_entity_type="treasury_ledger",
                related_entity_id=str(treasury_ledger.id),
                parent_event_id=payment.confirmed_continuity_event_id,
                payload={
                    "payment_intent_id": str(payment_intent_id),
                    "amount": str(fee_ledger.platform_fee_amount),
                    "currency": payment.currency,
                    "owner": "GLOBAL_IT_BUSINESS_SOLUTIONS",
                },
                auto_commit=False,
            )

            treasury_ledger.continuity_event_id = treasury_event.id
            db.add(treasury_ledger)

            # Step 4: Enforce immutability on ledgers
            LedgerSafetyService.enforce_payment_immutability(db, payment_intent_id)
            LedgerSafetyService.enforce_fee_ledger_immutability(db, fee_ledger.id)
            LedgerSafetyService.enforce_earning_ledger_immutability(db, earning_ledger.id)

            # Step 5: Emit allocation event (links all ledgers together)
            allocation_event = emit_continuity_event(
                db=db,
                business_owner_id=payment.business_owner_id,
                business_category_key=None,
                business_line=None,
                event_type="payment_allocated",
                actor_type="system",
                actor_id="payment_allocation",
                related_entity_type="payment_intent",
                related_entity_id=str(payment_intent_id),
                parent_event_id=payment.confirmed_continuity_event_id,
                payload={
                    "payment_intent_id": str(payment_intent_id),
                    "fee_ledger_id": str(fee_ledger.id),
                    "treasury_ledger_id": str(treasury_ledger.id),
                    "earning_ledger_id": str(earning_ledger.id),
                    "total_amount": str(payment.amount),
                    "platform_fee": str(fee_ledger.platform_fee_amount),
                    "provider_earnings": str(earning_ledger.amount),
                    "currency": payment.currency,
                },
                auto_commit=False,
            )

            # Mark payment as ledger-processed
            payment.ledger_processed_at = payment.confirmed_at  # Mark when allocation happened

            # Flush all changes (still in transaction)
            db.flush()
            db.refresh(fee_ledger)
            db.refresh(treasury_ledger)
            db.refresh(earning_ledger)
            db.refresh(payment)

        # Transaction committed successfully at this point
        return {
            "fee_ledger_id": str(fee_ledger.id),
            "treasury_ledger_id": str(treasury_ledger.id),
            "earning_ledger_id": str(earning_ledger.id),
            "payment_intent_id": str(payment_intent_id),
            "status": "allocated",
            "total_allocated": payment.amount,
            "platform_fee": fee_ledger.platform_fee_amount,
            "provider_earnings": earning_ledger.amount,
        }
