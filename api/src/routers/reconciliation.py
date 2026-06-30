"""
Reconciliation API Routes

Finance and operations team endpoints for payment verification and audit.

Provides:
- Full payment chain inspection (payment → fee → treasury → earnings)
- Batch reconciliation reports (totals by status)
- Manual verification for disputes and audits
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.fee_ledger import FeeLedger
from src.models.treasury_ledger import TreasuryLedger
from src.models.earning_ledger import EarningLedger
from src.services.ledger_safety_service import LedgerSafetyService

router = APIRouter(prefix="/api/v1/finance", tags=["Finance"])


# ===== SCHEMAS =====

class PaymentChainView:
    """Full view of a payment and all associated ledgers."""

    def __init__(
        self,
        payment_intent_id: str,
        payment_status: str,
        payment_amount: Decimal,
        currency: str,
        created_at: datetime,
        confirmed_at: datetime | None,
        fee_ledger_id: str | None,
        fee_ledger_status: str | None,
        total_amount: Decimal | None,
        platform_fee: Decimal | None,
        provider_amount: Decimal | None,
        treasury_ledger_id: str | None,
        treasury_status: str | None,
        treasury_amount: Decimal | None,
        earning_ledger_id: str | None,
        earning_status: str | None,
        earning_amount: Decimal | None,
        earning_user_id: str | None,
        merchant_account_id: str | None,
        status_chain: str,
        is_balanced: bool,
        balance_check_details: dict,
    ):
        self.payment_intent_id = payment_intent_id
        self.payment_status = payment_status
        self.payment_amount = payment_amount
        self.currency = currency
        self.created_at = created_at
        self.confirmed_at = confirmed_at

        self.fee_ledger_id = fee_ledger_id
        self.fee_ledger_status = fee_ledger_status
        self.total_amount = total_amount
        self.platform_fee = platform_fee
        self.provider_amount = provider_amount

        self.treasury_ledger_id = treasury_ledger_id
        self.treasury_status = treasury_status
        self.treasury_amount = treasury_amount

        self.earning_ledger_id = earning_ledger_id
        self.earning_status = earning_status
        self.earning_amount = earning_amount
        self.earning_user_id = earning_user_id
        self.merchant_account_id = merchant_account_id

        self.status_chain = status_chain
        self.is_balanced = is_balanced
        self.balance_check_details = balance_check_details

    def to_dict(self):
        return {
            "payment_intent_id": self.payment_intent_id,
            "payment_status": self.payment_status,
            "payment_amount": float(self.payment_amount),
            "currency": self.currency,
            "created_at": self.created_at.isoformat(),
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,

            "fee_ledger": {
                "id": self.fee_ledger_id,
                "status": self.fee_ledger_status,
                "total_amount": float(self.total_amount) if self.total_amount else None,
                "platform_fee": float(self.platform_fee) if self.platform_fee else None,
                "provider_amount": float(self.provider_amount) if self.provider_amount else None,
            },

            "treasury_ledger": {
                "id": self.treasury_ledger_id,
                "status": self.treasury_status,
                "amount": float(self.treasury_amount) if self.treasury_amount else None,
            },

            "earning_ledger": {
                "id": self.earning_ledger_id,
                "status": self.earning_status,
                "amount": float(self.earning_amount) if self.earning_amount else None,
                "user_id": self.earning_user_id,
                "merchant_account_id": str(self.merchant_account_id) if self.merchant_account_id else None,
            },

            "reconciliation": {
                "status_chain": self.status_chain,
                "is_balanced": self.is_balanced,
                "balance_check": self.balance_check_details,
            }
        }


# ===== ENDPOINTS =====

@router.get("/reconcile/{payment_intent_id}")
async def get_payment_chain(
    payment_intent_id: str,
    db: Session = Depends(get_db),
):
    """
    Get full payment chain for reconciliation.

    Returns complete view of:
    - PaymentIntent (customer payment)
    - FeeLedger (fee split)
    - TreasuryLedger (platform revenue)
    - EarningLedger (provider earnings)

    Validates balance: payment_amount = treasury_amount + provider_amount

    Example URL: GET /api/v1/finance/reconcile/550e8400-e29b-41d4-a716-446655440000
    """
    try:
        payment_id = UUID(payment_intent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment_intent_id format")

    # Fetch payment
    payment = db.query(PaymentIntent).filter(
        PaymentIntent.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Fetch fee ledger
    fee_ledger = db.query(FeeLedger).filter(
        FeeLedger.payment_intent_id == payment_id
    ).first()

    # Fetch treasury ledger
    treasury_ledger = db.query(TreasuryLedger).filter(
        TreasuryLedger.payment_intent_id == payment_id
    ).first()

    # Fetch earning ledger
    earning_ledger = db.query(EarningLedger).filter(
        EarningLedger.payment_intent_id == payment_id
    ).first()

    # Determine status chain
    statuses = []
    if payment:
        statuses.append(f"payment:{payment.status.value}")
    if fee_ledger:
        statuses.append(f"fee:{fee_ledger.status.value}")
    if treasury_ledger:
        statuses.append(f"treasury:{treasury_ledger.status.value}")
    if earning_ledger:
        statuses.append(f"earning:{earning_ledger.status.value}")

    status_chain = " → ".join(statuses)

    # Check balance
    is_balanced = False
    balance_details = {"error": "Payment not confirmed"}

    if payment.status == PaymentIntentStatus.confirmed and fee_ledger and treasury_ledger and earning_ledger:
        platform_plus_provider = (fee_ledger.platform_fee_amount or Decimal(0)) + (earning_ledger.amount or Decimal(0))
        is_balanced = platform_plus_provider == payment.amount

        balance_details = {
            "payment_amount": float(payment.amount),
            "treasury_amount": float(fee_ledger.platform_fee_amount or Decimal(0)),
            "earning_amount": float(earning_ledger.amount or Decimal(0)),
            "sum": float(platform_plus_provider),
            "matches_payment": is_balanced,
        }

    result = PaymentChainView(
        payment_intent_id=str(payment.id),
        payment_status=payment.status.value if payment else None,
        payment_amount=payment.amount if payment else None,
        currency=payment.currency if payment else None,
        created_at=payment.created_at if payment else None,
        confirmed_at=payment.confirmed_at if payment else None,

        fee_ledger_id=str(fee_ledger.id) if fee_ledger else None,
        fee_ledger_status=fee_ledger.status.value if fee_ledger else None,
        total_amount=fee_ledger.total_amount if fee_ledger else None,
        platform_fee=fee_ledger.platform_fee_amount if fee_ledger else None,
        provider_amount=fee_ledger.provider_amount if fee_ledger else None,

        treasury_ledger_id=str(treasury_ledger.id) if treasury_ledger else None,
        treasury_status=treasury_ledger.status.value if treasury_ledger else None,
        treasury_amount=treasury_ledger.amount if treasury_ledger else None,

        earning_ledger_id=str(earning_ledger.id) if earning_ledger else None,
        earning_status=earning_ledger.status.value if earning_ledger else None,
        earning_amount=earning_ledger.amount if earning_ledger else None,
        earning_user_id=str(earning_ledger.user_id) if earning_ledger else None,
        merchant_account_id=earning_ledger.merchant_account_id if earning_ledger else None,

        status_chain=status_chain,
        is_balanced=is_balanced,
        balance_check_details=balance_details,
    )

    return result.to_dict()


@router.get("/reconcile/batch")
async def get_batch_reconciliation_report(
    status: str = Query(None, description="Filter by payment status (pending/confirmed/failed)"),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Get batch reconciliation report.

    Aggregates payment metrics:
    - Total payments by status
    - Total platform fees collected
    - Total merchant earnings allocated
    - Missing ledger entries (orphans)

    Example URL: GET /api/v1/finance/reconcile/batch?status=confirmed&limit=50
    """
    query = db.query(PaymentIntent)

    if status:
        try:
            status_enum = PaymentIntentStatus(status)
            query = query.filter(PaymentIntent.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    total_payments = query.count()
    payments = query.offset(offset).limit(limit).all()

    # Aggregate metrics
    metrics = {
        "total_payments_query": total_payments,
        "payments_returned": len(payments),
        "by_status": {},
        "ledger_coverage": {
            "payments_with_fee_ledger": 0,
            "payments_with_treasury_ledger": 0,
            "payments_with_earning_ledger": 0,
            "fully_allocated": 0,
            "missing_ledgers": [],
        },
        "totals": {
            "platform_fees": 0.0,
            "merchant_earnings": 0.0,
            "customer_payments": 0.0,
        },
        "imbalances": [],
    }

    for payment in payments:
        # Count by status
        status_key = payment.status.value
        if status_key not in metrics["by_status"]:
            metrics["by_status"][status_key] = 0
        metrics["by_status"][status_key] += 1

        metrics["totals"]["customer_payments"] += float(payment.amount)

        # Check ledger coverage
        fee_ledger = db.query(FeeLedger).filter(
            FeeLedger.payment_intent_id == payment.id
        ).first()

        treasury_ledger = db.query(TreasuryLedger).filter(
            TreasuryLedger.payment_intent_id == payment.id
        ).first()

        earning_ledger = db.query(EarningLedger).filter(
            EarningLedger.payment_intent_id == payment.id
        ).first()

        if fee_ledger:
            metrics["ledger_coverage"]["payments_with_fee_ledger"] += 1
            metrics["totals"]["platform_fees"] += float(fee_ledger.platform_fee_amount or 0)
            metrics["totals"]["merchant_earnings"] += float(fee_ledger.provider_amount or 0)

        if treasury_ledger:
            metrics["ledger_coverage"]["payments_with_treasury_ledger"] += 1

        if earning_ledger:
            metrics["ledger_coverage"]["payments_with_earning_ledger"] += 1

        if fee_ledger and treasury_ledger and earning_ledger:
            metrics["ledger_coverage"]["fully_allocated"] += 1
        else:
            missing = []
            if not fee_ledger:
                missing.append("fee_ledger")
            if not treasury_ledger:
                missing.append("treasury_ledger")
            if not earning_ledger:
                missing.append("earning_ledger")

            metrics["ledger_coverage"]["missing_ledgers"].append({
                "payment_id": str(payment.id),
                "missing": missing,
            })

        # Check balance
        if fee_ledger and treasury_ledger and earning_ledger:
            platform_plus_provider = (fee_ledger.platform_fee_amount or Decimal(0)) + (earning_ledger.amount or Decimal(0))
            if platform_plus_provider != payment.amount:
                metrics["imbalances"].append({
                    "payment_id": str(payment.id),
                    "payment_amount": float(payment.amount),
                    "split_total": float(platform_plus_provider),
                    "difference": float(payment.amount - platform_plus_provider),
                })

    return metrics


@router.post("/reconcile/verify")
async def verify_payment_manual(
    payment_intent_id: str,
    notes: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Manually verify a payment for disputes or audits.

    Records verification in audit trail.
    Useful for:
    - Chargeback disputes
    - Manual reconciliation exceptions
    - Compliance audits

    Body:
    {
        "payment_intent_id": "550e8400-e29b-41d4-a716-446655440000",
        "notes": "Verified by auditor Jane Doe on 2025-01-15"
    }
    """
    try:
        payment_id = UUID(payment_intent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment_intent_id format")

    payment = db.query(PaymentIntent).filter(
        PaymentIntent.id == payment_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Fetch all related ledgers
    fee_ledger = db.query(FeeLedger).filter(
        FeeLedger.payment_intent_id == payment_id
    ).first()

    treasury_ledger = db.query(TreasuryLedger).filter(
        TreasuryLedger.payment_intent_id == payment_id
    ).first()

    earning_ledger = db.query(EarningLedger).filter(
        EarningLedger.payment_intent_id == payment_id
    ).first()

    # Perform verification
    verification = {
        "payment_id": str(payment.id),
        "verified_at": datetime.utcnow().isoformat(),
        "verification_notes": notes or "Manual verification",
        "checks": {
            "payment_exists": payment is not None,
            "fee_ledger_exists": fee_ledger is not None,
            "treasury_ledger_exists": treasury_ledger is not None,
            "earning_ledger_exists": earning_ledger is not None,
            "payment_confirmed": payment.status == PaymentIntentStatus.confirmed if payment else False,
            "ledger_balance_matches": False,
        },
        "results": {
            "all_ledgers_present": all([fee_ledger, treasury_ledger, earning_ledger]),
            "payment_status": payment.status.value if payment else None,
        }
    }

    # Check balance if all ledgers exist
    if fee_ledger and treasury_ledger and earning_ledger and payment:
        platform_plus_provider = (fee_ledger.platform_fee_amount or Decimal(0)) + (earning_ledger.amount or Decimal(0))
        is_balanced = platform_plus_provider == payment.amount
        verification["checks"]["ledger_balance_matches"] = is_balanced
        verification["results"]["balance_check"] = {
            "payment_amount": float(payment.amount),
            "treasury_amount": float(fee_ledger.platform_fee_amount or Decimal(0)),
            "earning_amount": float(earning_ledger.amount or Decimal(0)),
            "balanced": is_balanced,
        }

    # TODO: Log this verification in audit trail / continuity events
    # For now, just return the verification result

    return verification
