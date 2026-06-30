"""
Fee Ledger Service

Implements fee allocation logic:
- Calculate platform and provider splits
- Create fee ledger entries
- Route platform fees to Global IT and Business Solutions
- Trigger provider earnings creation
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from src.models.fee_ledger import FeeLedger, FeeLedgerStatus
from src.models.payment_intent import PaymentIntent
from src.schemas.financial_schema import FeeLedgerCreate


class FeeService:
    """Service layer for financial fee allocation"""

    # Default fee configuration (percentage)
    # Future: upgrade to dynamic fees based on trust level
    DEFAULT_PLATFORM_FEE_PERCENT = Decimal("10")  # 10% to platform
    DEFAULT_PROVIDER_FEE_PERCENT = Decimal("90")  # 90% to provider

    @staticmethod
    def calculate_fee_split(
        total_amount: Decimal,
        platform_fee_percent: Decimal = DEFAULT_PLATFORM_FEE_PERCENT,
    ) -> tuple[Decimal, Decimal]:
        """
        Calculate platform fee and provider amount from total payment.

        Args:
            total_amount: Total payment amount
            platform_fee_percent: Platform fee as percentage (default 10%)

        Returns:
            (platform_fee_amount, provider_amount)

        Ensures: platform_fee + provider_amount == total_amount
        """
        # Platform fee = total * platform_fee_percent / 100
        platform_fee = (total_amount * platform_fee_percent) / Decimal("100")

        # Provider amount = total - platform_fee
        provider_amount = total_amount - platform_fee

        # Verify math (safety check)
        if (platform_fee + provider_amount) != total_amount:
            raise ValueError(
                f"Fee calculation error: {platform_fee} + {provider_amount} != {total_amount}"
            )

        return platform_fee, provider_amount

    @staticmethod
    def create_fee_ledger(
        db: Session,
        payment_intent_id: UUID,
        total_amount: Decimal,
        currency: str = "ZAR",
        platform_fee_percent: Decimal = DEFAULT_PLATFORM_FEE_PERCENT,
        platform_account_name: str = "GLOBAL_IT_BUSINESS_SOLUTIONS",
    ) -> FeeLedger:
        """
        Create a fee ledger entry for a payment.

        This splits the payment into:
        1. Platform fee (10% default) → Global IT and Business Solutions
        2. Provider amount (90% default) → Provider's EarningLedger

        Args:
            db: Database session
            payment_intent_id: The payment being split
            total_amount: Total payment amount
            currency: Currency code (default ZAR)
            platform_fee_percent: Platform fee percentage (default 10%)
            platform_account_name: Destination account (default GLOBAL_IT_BUSINESS_SOLUTIONS)

        Returns:
            Created FeeLedger object

        Raises:
            ValueError: If payment not found or already has a fee ledger
        """
        # Validate payment exists
        payment = db.query(PaymentIntent).filter(
            PaymentIntent.id == payment_intent_id
        ).first()

        if not payment:
            raise ValueError(f"PaymentIntent {payment_intent_id} not found")

        # Check if fee ledger already exists for this payment
        existing = db.query(FeeLedger).filter(
            FeeLedger.payment_intent_id == payment_intent_id
        ).first()

        if existing:
            raise ValueError(
                f"FeeLedger already exists for payment {payment_intent_id}"
            )

        # Calculate fee split
        platform_fee, provider_amount = FeeService.calculate_fee_split(
            total_amount,
            platform_fee_percent,
        )

        # Create fee ledger entry
        fee_ledger = FeeLedger(
            payment_intent_id=payment_intent_id,
            total_amount=total_amount,
            currency=currency,
            platform_fee_percent=platform_fee_percent,
            platform_fee_amount=platform_fee,
            provider_amount=provider_amount,
            platform_account_name=platform_account_name,
            status=FeeLedgerStatus.created,
        )

        db.add(fee_ledger)
        db.commit()
        db.refresh(fee_ledger)

        return fee_ledger

    @staticmethod
    def mark_fee_allocated(
        db: Session,
        fee_ledger_id: UUID,
        earning_ledger_id: UUID,
        continuity_event_id: UUID | None = None,
    ) -> FeeLedger:
        """
        Mark fee ledger as allocated (provider earnings created).

        Called after EarningLedger entry is successfully created.
        """
        fee_ledger = db.query(FeeLedger).filter(
            FeeLedger.id == fee_ledger_id
        ).first()

        if not fee_ledger:
            raise ValueError(f"FeeLedger {fee_ledger_id} not found")

        fee_ledger.status = FeeLedgerStatus.allocated
        fee_ledger.earning_ledger_id = earning_ledger_id
        fee_ledger.allocated_at = datetime.utcnow()
        fee_ledger.fee_allocation_continuity_event_id = continuity_event_id

        db.commit()
        db.refresh(fee_ledger)

        return fee_ledger

    @staticmethod
    def mark_fee_settled(
        db: Session,
        fee_ledger_id: UUID,
        treasury_transaction_id: UUID | None = None,
    ) -> FeeLedger:
        """
        Mark fee ledger as settled (both treasury and earnings confirmed).

        Called after platform fee and provider earnings are both locked.
        """
        fee_ledger = db.query(FeeLedger).filter(
            FeeLedger.id == fee_ledger_id
        ).first()

        if not fee_ledger:
            raise ValueError(f"FeeLedger {fee_ledger_id} not found")

        fee_ledger.status = FeeLedgerStatus.settled
        fee_ledger.treasury_transaction_id = treasury_transaction_id
        fee_ledger.settled_at = datetime.utcnow()

        db.commit()
        db.refresh(fee_ledger)

        return fee_ledger

    @staticmethod
    def get_fee_ledger_by_payment(
        db: Session,
        payment_intent_id: UUID,
    ) -> FeeLedger | None:
        """Get fee ledger for a specific payment"""
        return db.query(FeeLedger).filter(
            FeeLedger.payment_intent_id == payment_intent_id
        ).first()

    @staticmethod
    def get_platform_fees_total(
        db: Session,
        platform_account_name: str = "GLOBAL_IT_BUSINESS_SOLUTIONS",
    ) -> Decimal:
        """
        Get total platform fees accumulated.

        Useful for reporting and treasury reconciliation.
        """
        result = db.query(func.sum(FeeLedger.platform_fee_amount)).filter(
            FeeLedger.platform_account_name == platform_account_name,
            FeeLedger.status.in_([FeeLedgerStatus.allocated, FeeLedgerStatus.settled]),
        ).scalar()

        return result or Decimal("0")


# Import at module level for transaction context
from sqlalchemy import func
