import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel

from src.database import get_db
from src.models.fee_ledger import FeeLedger, FeeLedgerStatus
from src.models.treasury_ledger import TreasuryLedger, TreasuryLedgerStatus
from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.merchant_account import MerchantAccount
from src.models.profile import Profile
from src.models.order import Order, OrderStatus
from src.auth.supabase_auth import require_supaadmin
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter(prefix="/api/v1/admin/treasury", tags=["Admin Treasury & Governance"])


# ----------------------------------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------------------------------
class TreasurySummaryOut(BaseModel):
    gross_transaction_volume: Decimal
    platform_fee_revenue: Decimal
    treasury_vault_balance: Decimal
    merchant_earnings_total: Decimal
    merchant_payout_pending: Decimal
    total_orders_count: int
    paid_orders_count: int
    gateway_breakdown: Dict[str, Dict[str, Any]]
    carrier_breakdown: Dict[str, Dict[str, Any]]


class TreasuryTransactionOut(BaseModel):
    id: str
    order_number: Optional[str] = None
    buyer_email: Optional[str] = None
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None
    gateway: str
    payment_reference: Optional[str] = None
    total_amount: Decimal
    platform_fee_10pct: Decimal
    merchant_earning_90pct: Decimal
    currency: str
    status: str
    created_at: datetime


class PayoutQueueItem(BaseModel):
    merchant_id: str
    merchant_name: str
    email: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    branch_code: Optional[str] = None
    available_balance: Decimal
    pending_payouts_count: int
    currency: str


class SettlementActionRequest(BaseModel):
    settlement_reference: Optional[str] = None
    notes: Optional[str] = None


# ----------------------------------------------------------------------------
# 1. TREASURY SUMMARY ENDPOINT
# ----------------------------------------------------------------------------
@router.get("/summary", response_model=TreasurySummaryOut)
def get_treasury_summary(
    current_user: dict = Depends(require_supaadmin),
    db: Session = Depends(get_db)
):
    """
    Returns platform-wide financial summary across all orders, fee allocations,
    and merchant earning ledgers. Enforces SupaAdmin privileges.
    """
    # 1. Gross Volume Processed (all confirmed payment intents)
    gross_volume = db.query(func.coalesce(func.sum(PaymentIntent.amount), 0))\
        .filter(PaymentIntent.status == PaymentIntentStatus.confirmed)\
        .scalar()

    # 2. Platform 10% Fee Revenue (sum of all fee ledger splits)
    platform_fees = db.query(func.coalesce(func.sum(FeeLedger.platform_fee_amount), 0))\
        .scalar()

    # 3. Treasury Vault Net Balance (allocated platform vault balance)
    vault_balance = db.query(func.coalesce(func.sum(TreasuryLedger.amount), 0))\
        .filter(TreasuryLedger.status.in_([TreasuryLedgerStatus.allocated, TreasuryLedgerStatus.settled]))\
        .scalar()

    # 4. Total Merchant Earnings Generated (90% share)
    merchant_earnings = db.query(func.coalesce(func.sum(EarningLedger.amount), 0))\
        .scalar()

    # 5. Pending Merchant Payouts (funds available for bank disbursement)
    payouts_pending = db.query(func.coalesce(func.sum(EarningLedger.amount), 0))\
        .filter(EarningLedger.status == EarningLedgerStatus.available)\
        .scalar()

    # 6. Orders Count
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    paid_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.paid).scalar() or 0

    # 7. Gateway Breakdown
    gateways = ["payfast", "paystack", "payjustnow"]
    gateway_breakdown = {}
    for gw in gateways:
        gw_count = db.query(func.count(Order.id))\
            .filter(Order.payment_provider == gw, Order.status == OrderStatus.paid)\
            .scalar() or 0
        gw_volume = db.query(func.coalesce(func.sum(Order.total_amount), 0))\
            .filter(Order.payment_provider == gw, Order.status == OrderStatus.paid)\
            .scalar() or Decimal("0.00")
        gateway_breakdown[gw] = {
            "order_count": gw_count,
            "volume": float(gw_volume)
        }

    # 8. Carrier Breakdown
    carriers = ["courier_guy", "pudo", "pickup"]
    carrier_breakdown = {}
    for cr in carriers:
        cr_count = db.query(func.count(Order.id))\
            .filter(Order.shipping_provider == cr, Order.status == OrderStatus.paid)\
            .scalar() or 0
        carrier_breakdown[cr] = {
            "shipment_count": cr_count
        }

    return TreasurySummaryOut(
        gross_transaction_volume=Decimal(str(gross_volume)),
        platform_fee_revenue=Decimal(str(platform_fees)),
        treasury_vault_balance=Decimal(str(vault_balance)),
        merchant_earnings_total=Decimal(str(merchant_earnings)),
        merchant_payout_pending=Decimal(str(payouts_pending)),
        total_orders_count=total_orders,
        paid_orders_count=paid_orders,
        gateway_breakdown=gateway_breakdown,
        carrier_breakdown=carrier_breakdown
    )


# ----------------------------------------------------------------------------
# 2. REAL-TIME AUDITED TRANSACTION FEED
# ----------------------------------------------------------------------------
@router.get("/transactions", response_model=List[TreasuryTransactionOut])
def list_treasury_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_supaadmin),
    db: Session = Depends(get_db)
):
    """
    Paginated real-time ledger feed displaying fee splits, merchant shares,
    and gateway references.
    """
    fee_entries = db.query(FeeLedger)\
        .order_by(desc(FeeLedger.created_at))\
        .offset(offset)\
        .limit(limit)\
        .all()

    results = []
    for fee in fee_entries:
        # Resolve order and merchant profile
        order = db.query(Order).filter(Order.order_number == fee.idempotency_key.replace("FEE-ORDER-", "")).first() if fee.idempotency_key else None
        merchant = db.query(Profile).filter(Profile.owner_id == str(fee.provider_user_id)).first()

        results.append(TreasuryTransactionOut(
            id=str(fee.id),
            order_number=order.order_number if order else (fee.idempotency_key or "N/A"),
            buyer_email=order.customer_email if order else None,
            merchant_id=str(fee.provider_user_id),
            merchant_name=merchant.name if merchant else "Merchant",
            gateway=order.payment_provider if order else "payment_gateway",
            payment_reference=fee.provider_event_id,
            total_amount=fee.total_amount,
            platform_fee_10pct=fee.platform_fee_amount,
            merchant_earning_90pct=fee.provider_amount,
            currency=fee.currency,
            status=fee.status.value if hasattr(fee.status, "value") else str(fee.status),
            created_at=fee.created_at
        ))

    return results


# ----------------------------------------------------------------------------
# 3. MERCHANT SETTLEMENT & PAYOUT QUEUE
# ----------------------------------------------------------------------------
@router.get("/merchants/payout-queue", response_model=List[PayoutQueueItem])
def get_payout_queue(
    current_user: dict = Depends(require_supaadmin),
    db: Session = Depends(get_db)
):
    """
    Lists all merchants who have accumulated available earnings ready for bank transfer.
    """
    # Group available earnings by user_id
    available_earnings = db.query(
        EarningLedger.user_id,
        func.sum(EarningLedger.amount).label("total_avail"),
        func.count(EarningLedger.id).label("entry_count")
    ).filter(
        EarningLedger.status == EarningLedgerStatus.available
    ).group_by(
        EarningLedger.user_id
    ).all()

    queue = []
    for item in available_earnings:
        user_id, total_avail, entry_count = item
        merchant = db.query(Profile).filter((Profile.owner_id == user_id) | (Profile.id == user_id)).first()
        m_account = db.query(MerchantAccount).filter(MerchantAccount.user_id == user_id).first()

        queue.append(PayoutQueueItem(
            merchant_id=str(user_id),
            merchant_name=merchant.name if merchant else "Registered Merchant",
            email=merchant.email if merchant else None,
            bank_name=m_account.bank_name if m_account else "Not Configured",
            account_number=m_account.account_number if m_account else "N/A",
            branch_code=m_account.branch_code if m_account else "N/A",
            available_balance=Decimal(str(total_avail or 0.00)),
            pending_payouts_count=entry_count,
            currency="ZAR"
        ))

    return queue


@router.post("/merchants/{merchant_id}/settle")
def settle_merchant_earnings(
    merchant_id: str,
    payload: SettlementActionRequest,
    current_user: dict = Depends(require_supaadmin),
    db: Session = Depends(get_db)
):
    """
    Executes settlement of all available earnings for a given merchant,
    transitioning EarningLedger status to 'paid' and emitting an audit event.
    """
    earnings = db.query(EarningLedger).filter(
        EarningLedger.user_id == merchant_id,
        EarningLedger.status == EarningLedgerStatus.available
    ).all()

    if not earnings:
        raise HTTPException(status_code=400, detail="No available earnings found for settlement")

    total_settled = Decimal("0.00")
    for e in earnings:
        e.status = EarningLedgerStatus.paid
        e.paid_at = datetime.utcnow()
        e.notes = f"Settled by SupaAdmin {current_user.get('email', 'platform-owner')}. Ref: {payload.settlement_reference or 'EFT-BATCH'}"
        total_settled += Decimal(str(e.amount))

    db.commit()

    # Emit Governance Continuity Event
    emit_continuity_event(
        db,
        business_owner_id=merchant_id,
        business_category_key=None,
        business_line=None,
        event_type="merchant_earnings_settled",
        actor_type="supaadmin",
        actor_id=current_user.get("uid", "supaadmin"),
        related_entity_type="earning_ledger",
        related_entity_id=merchant_id,
        parent_event_id=None,
        payload={
            "merchant_id": merchant_id,
            "total_settled_zar": float(total_settled),
            "entries_settled_count": len(earnings),
            "settlement_reference": payload.settlement_reference or "MANUAL-EFT-SETTLEMENT",
            "settled_by": current_user.get("email")
        },
        auto_commit=True
    )

    return {
        "status": "success",
        "message": f"Successfully settled R{total_settled} across {len(earnings)} earnings entries.",
        "total_settled": float(total_settled),
        "entries_count": len(earnings)
    }
