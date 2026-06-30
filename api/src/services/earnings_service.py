"""
Earnings Service Layer

Implements business logic for:
- Merchant account management
- Earning ledger lifecycle
- Payout eligibility validation
- Financial audit trails
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from src.models.merchant_account import MerchantAccount, MerchantVerificationStatus
from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
from src.models.payment_intent import PaymentIntent
from src.models.profile import Profile
from src.schemas.financial_schema import (
    MerchantAccountCreate,
    MerchantAccountUpdate,
    MerchantAccountVerify,
    EarningLedgerCreate,
    EarningLedgerStatusUpdate,
    UserEarningsSummary,
)


class EarningsService:
    """Service layer for financial operations"""

    # ===========================================
    # MERCHANT ACCOUNT OPERATIONS
    # ===========================================

    @staticmethod
    def create_merchant_account(
        db: Session,
        merchant_data: MerchantAccountCreate
    ) -> MerchantAccount:
        """
        Create a new merchant account for a service provider.

        Args:
            db: Database session
            merchant_data: Merchant account creation input

        Returns:
            Created MerchantAccount object

        Raises:
            ValueError: If user already has a merchant account
        """
        # Check if user already has a merchant account
        existing = db.query(MerchantAccount).filter(
            MerchantAccount.user_id == merchant_data.user_id
        ).first()

        if existing:
            raise ValueError(f"User {merchant_data.user_id} already has a merchant account")

        # Create new merchant account (starts unverified)
        merchant = MerchantAccount(
            user_id=merchant_data.user_id,
            bank_name=merchant_data.bank_name,
            account_holder_name=merchant_data.account_holder_name,
            account_number=merchant_data.account_number,
            branch_code=merchant_data.branch_code,
            account_type=merchant_data.account_type,
            minimum_balance_for_payout=merchant_data.minimum_balance_for_payout,
            verification_status=MerchantVerificationStatus.unverified,
            payout_enabled=False,
        )

        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        return merchant

    @staticmethod
    def get_merchant_account(db: Session, user_id: str) -> MerchantAccount | None:
        """Get merchant account for a user"""
        return db.query(MerchantAccount).filter(
            MerchantAccount.user_id == user_id
        ).first()

    @staticmethod
    def verify_merchant_account(
        db: Session,
        user_id: str,
        verify_data: MerchantAccountVerify
    ) -> MerchantAccount:
        """
        Verify or update verification status of a merchant account.

        Only users with verified + active merchant accounts are payout-eligible.
        """
        merchant = EarningsService.get_merchant_account(db, user_id)

        if not merchant:
            raise ValueError(f"No merchant account for user {user_id}")

        merchant.verification_status = verify_data.verification_status
        merchant.verified_by = verify_data.verified_by
        merchant.verification_timestamp = datetime.utcnow()

        # Enable payouts only if verified
        if verify_data.verification_status == MerchantVerificationStatus.verified:
            merchant.payout_enabled = True
        else:
            merchant.payout_enabled = False

        # Handle suspension
        if verify_data.verification_status == MerchantVerificationStatus.suspended:
            merchant.is_active = False
            merchant.suspended_at = datetime.utcnow()
            merchant.suspension_reason = verify_data.suspension_reason

        db.commit()
        db.refresh(merchant)
        return merchant

    @staticmethod
    def update_merchant_account(
        db: Session,
        user_id: str,
        update_data: MerchantAccountUpdate
    ) -> MerchantAccount:
        """Update merchant account banking details"""
        merchant = EarningsService.get_merchant_account(db, user_id)

        if not merchant:
            raise ValueError(f"No merchant account for user {user_id}")

        # Update only provided fields
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(merchant, field, value)

        db.commit()
        db.refresh(merchant)
        return merchant

    # ===========================================
    # EARNING LEDGER OPERATIONS
    # ===========================================

    @staticmethod
    def create_earning_ledger(
        db: Session,
        ledger_data: EarningLedgerCreate
    ) -> EarningLedger:
        """
        Create an earning ledger entry when payment is received.

        Entry starts in PENDING status, waiting for trust validation.

        Args:
            db: Database session
            ledger_data: Earning ledger creation input

        Returns:
            Created EarningLedger object

        Raises:
            ValueError: If payment or merchant account not found
        """
        # Validate payment exists
        payment = db.query(PaymentIntent).filter(
            PaymentIntent.id == ledger_data.payment_intent_id
        ).first()

        if not payment:
            raise ValueError(f"PaymentIntent {ledger_data.payment_intent_id} not found")

        # Validate merchant account exists
        merchant = db.query(MerchantAccount).filter(
            MerchantAccount.id == ledger_data.merchant_account_id
        ).first()

        if not merchant:
            raise ValueError(f"MerchantAccount {ledger_data.merchant_account_id} not found")

        if merchant.user_id != ledger_data.user_id:
            raise ValueError("MerchantAccount does not belong to this user")

        # Create ledger entry (starts PENDING)
        ledger = EarningLedger(
            user_id=ledger_data.user_id,
            merchant_account_id=ledger_data.merchant_account_id,
            payment_intent_id=ledger_data.payment_intent_id,
            opportunity_id=ledger_data.opportunity_id,
            amount=ledger_data.amount,
            currency=ledger_data.currency,
            status=EarningLedgerStatus.pending,
            notes=ledger_data.notes,
        )

        db.add(ledger)
        db.commit()
        db.refresh(ledger)
        return ledger

    @staticmethod
    def process_payment_split(
        db: Session,
        payment_intent_id: UUID,
        provider_user_id: str,
        merchant_account_id: UUID,
        opportunity_id: str | None = None,
        platform_fee_percent: Decimal | None = None,
    ) -> tuple:
        """
        Complete payment split flow: FeeLedger → EarningLedger.

        This is the CRITICAL integration point that ensures money never disappears.

        Flow:
        1. Fetch PaymentIntent
        2. Create FeeLedger (split into platform_fee + provider_amount)
        3. Create EarningLedger for provider (with provider_amount)
        4. Mark FeeLedger as allocated
        5. Return both objects for continuity event creation

        Args:
            db: Database session
            payment_intent_id: Payment to split
            provider_user_id: Service provider who earned this
            merchant_account_id: Provider's merchant account
            opportunity_id: Optional opportunity reference
            platform_fee_percent: Override default fee percent (default 10%)

        Returns:
            (fee_ledger, earning_ledger) tuple

        Raises:
            ValueError: If payment, merchant, or provider not found
        """
        from src.services.fee_service import FeeService

        # Validate payment exists
        payment = db.query(PaymentIntent).filter(
            PaymentIntent.id == payment_intent_id
        ).first()

        if not payment:
            raise ValueError(f"PaymentIntent {payment_intent_id} not found")

        if payment.status.value != "confirmed":
            raise ValueError(
                f"Payment must be confirmed before split. Current status: {payment.status}"
            )

        # Validate merchant account exists
        merchant = db.query(MerchantAccount).filter(
            MerchantAccount.id == merchant_account_id
        ).first()

        if not merchant:
            raise ValueError(f"MerchantAccount {merchant_account_id} not found")

        if merchant.user_id != provider_user_id:
            raise ValueError(
                f"MerchantAccount does not belong to user {provider_user_id}"
            )

        # Use provided fee percent or default to 10%
        if platform_fee_percent is None:
            platform_fee_percent = Decimal("10")

        # Step 1: Create FeeLedger (splits the money)
        fee_ledger = FeeService.create_fee_ledger(
            db=db,
            payment_intent_id=payment_intent_id,
            total_amount=payment.amount,
            currency=payment.currency,
            platform_fee_percent=platform_fee_percent,
            platform_account_name="GLOBAL_IT_BUSINESS_SOLUTIONS",
        )

        # Step 2: Create EarningLedger for provider (with provider_amount from fee split)
        earning_ledger = EarningsService.create_earning_ledger(
            db=db,
            ledger_data=EarningLedgerCreate(
                user_id=provider_user_id,
                merchant_account_id=merchant_account_id,
                payment_intent_id=payment_intent_id,
                opportunity_id=opportunity_id,
                amount=fee_ledger.provider_amount,  # Provider gets the split amount
                currency=payment.currency,
                notes=f"Provider share from payment split (platform fee: {fee_ledger.platform_fee_amount})",
            )
        )

        # Step 3: Mark fee ledger as allocated
        FeeService.mark_fee_allocated(
            db=db,
            fee_ledger_id=fee_ledger.id,
            earning_ledger_id=earning_ledger.id,
        )

        return fee_ledger, earning_ledger

    @staticmethod
    def transition_ledger_status(
        db: Session,
        ledger_id: UUID,
        transition_data: EarningLedgerStatusUpdate
    ) -> EarningLedger:
        """
        Transition earning ledger to next status.

        Allowed transitions:
        - pending → available (trust validation passed)
        - pending → reversed (dispute/refund)
        - available → paid (included in payout)
        - paid → reversed (dispute after payout)
        """
        ledger = db.query(EarningLedger).filter(
            EarningLedger.id == ledger_id
        ).first()

        if not ledger:
            raise ValueError(f"EarningLedger {ledger_id} not found")

        # Record status transition
        old_status = ledger.status
        new_status = transition_data.status

        # Validate state transition
        valid_transitions = {
            EarningLedgerStatus.pending: [
                EarningLedgerStatus.available,
                EarningLedgerStatus.reversed,
            ],
            EarningLedgerStatus.available: [
                EarningLedgerStatus.paid,
                EarningLedgerStatus.reversed,
            ],
            EarningLedgerStatus.paid: [
                EarningLedgerStatus.reversed,  # Dispute after payout
            ],
            EarningLedgerStatus.reversed: [],  # Terminal state
        }

        if new_status not in valid_transitions.get(old_status, []):
            raise ValueError(
                f"Invalid transition: {old_status} → {new_status}"
            )

        # Update status and set appropriate timestamp
        ledger.status = new_status

        if new_status == EarningLedgerStatus.available:
            ledger.available_at = datetime.utcnow()
        elif new_status == EarningLedgerStatus.paid:
            ledger.paid_at = datetime.utcnow()
            ledger.payout_batch_id = transition_data.payout_batch_id
            ledger.payout_request_id = transition_data.payout_request_id
        elif new_status == EarningLedgerStatus.reversed:
            ledger.reversed_at = datetime.utcnow()
            ledger.reversal_reason = transition_data.reversal_reason
            ledger.reversal_triggered_by = transition_data.reversal_triggered_by
            ledger.reversal_notes = transition_data.reversal_notes

        # Record continuity event reference if provided
        if transition_data.status_change_continuity_event_id:
            ledger.status_change_continuity_event_id = (
                transition_data.status_change_continuity_event_id
            )

        db.commit()
        db.refresh(ledger)
        return ledger

    # ===========================================
    # QUERY & AGGREGATION
    # ===========================================

    @staticmethod
    def get_user_earnings_by_status(
        db: Session,
        user_id: str,
        status: EarningLedgerStatus
    ) -> list[EarningLedger]:
        """Get all earnings for a user in a specific status"""
        return db.query(EarningLedger).filter(
            and_(
                EarningLedger.user_id == user_id,
                EarningLedger.status == status,
            )
        ).all()

    @staticmethod
    def calculate_user_earnings_summary(
        db: Session,
        user_id: str
    ) -> UserEarningsSummary:
        """
        Calculate comprehensive earnings summary for a user.

        Returns totals for:
        - Total earned (all statuses)
        - Pending amount (awaiting trust validation)
        - Available amount (ready for withdrawal)
        - Paid amount (transferred to bank)
        - Reversed amount (disputes/refunds)
        """
        # Get merchant account
        merchant = EarningsService.get_merchant_account(db, user_id)

        # Calculate totals by status
        totals = db.query(
            EarningLedger.status,
            func.sum(EarningLedger.amount).label("total"),
        ).filter(
            EarningLedger.user_id == user_id
        ).group_by(EarningLedger.status).all()

        earnings_by_status = {row[0]: row[1] or Decimal("0") for row in totals}

        # Get last payout date
        last_paid = db.query(
            func.max(EarningLedger.paid_at)
        ).filter(
            EarningLedger.user_id == user_id,
            EarningLedger.status == EarningLedgerStatus.paid,
        ).scalar()

        # Determine payout eligibility
        is_eligible = False
        if merchant and merchant.verification_status == MerchantVerificationStatus.verified:
            available = earnings_by_status.get(
                EarningLedgerStatus.available, Decimal("0")
            )
            if available >= merchant.minimum_balance_for_payout:
                is_eligible = True

        return UserEarningsSummary(
            user_id=user_id,
            merchant_account=merchant,
            total_earned=(
                earnings_by_status.get(EarningLedgerStatus.pending, Decimal("0")) +
                earnings_by_status.get(EarningLedgerStatus.available, Decimal("0")) +
                earnings_by_status.get(EarningLedgerStatus.paid, Decimal("0"))
            ),
            pending_amount=earnings_by_status.get(EarningLedgerStatus.pending, Decimal("0")),
            available_amount=earnings_by_status.get(EarningLedgerStatus.available, Decimal("0")),
            paid_amount=earnings_by_status.get(EarningLedgerStatus.paid, Decimal("0")),
            reversed_amount=earnings_by_status.get(EarningLedgerStatus.reversed, Decimal("0")),
            is_payout_eligible=is_eligible,
            last_payout_at=last_paid,
        )

    @staticmethod
    def get_available_for_payout(
        db: Session,
        user_id: str
    ) -> Decimal:
        """Get total amount available for withdrawal by user"""
        result = db.query(func.sum(EarningLedger.amount)).filter(
            and_(
                EarningLedger.user_id == user_id,
                EarningLedger.status == EarningLedgerStatus.available,
            )
        ).scalar()

        return result or Decimal("0")

    @staticmethod
    def is_payout_eligible(
        db: Session,
        user_id: str,
        trust_score_threshold: int = 50
    ) -> tuple[bool, str]:
        """
        Check if user is eligible to request payout.

        Returns: (is_eligible: bool, reason: str)

        Eligibility requires:
        1. Verified merchant account
        2. Account is active (not suspended)
        3. Available balance > 0
        4. Trust score >= threshold (checked separately)
        """
        merchant = EarningsService.get_merchant_account(db, user_id)

        if not merchant:
            return False, "No merchant account"

        if not merchant.is_active:
            return False, "Merchant account suspended"

        if merchant.verification_status != MerchantVerificationStatus.verified:
            return False, "Merchant account not verified"

        available = EarningsService.get_available_for_payout(db, user_id)
        if available <= Decimal("0"):
            return False, "No available balance"

        # Trust score check is delegated to caller (requires Profile service)
        return True, "Eligible"
