from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from src.database import get_db, replay_transaction
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.auth.supabase_auth import get_current_user
from src.services.continuity_event_service import emit_continuity_event
from src.config import BOOTSTRAP_ADMIN_EMAILS
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])
# Compatibility for main.py which included admin_router separately
admin_router = APIRouter()

def get_admin_user(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user["uid"]).first()
    if not profile:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user_email = user.get("email", "").lower()
    if user_email in BOOTSTRAP_ADMIN_EMAILS and getattr(profile, "role", "steward") != "admin":
        with replay_transaction(db):
            profile.role = "admin"
            emit_continuity_event(
                db=db,
                profile_id=profile.id,
                event_type="AdminAutoPromotion",
                description="Auto-promoted bootstrap admin on login.",
                category="system"
            )
            db.flush()
            db.refresh(profile)
            
    if getattr(profile, "role", "steward") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return profile

def get_bootstrap_admin(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_admin_user(user, db)
    user_email = user.get("email", "").lower()
    if user_email not in BOOTSTRAP_ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Bootstrap admin access required")
    return profile

class DashboardStatsOut(BaseModel):
    total_profiles: int
    pending_reviews: int
    approved_profiles: int
    total_opportunities: int

@router.get("/dashboard", response_model=DashboardStatsOut)
def get_admin_dashboard(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_profiles = db.query(func.count(Profile.id)).scalar() or 0
    pending_reviews = db.query(func.count(Profile.id)).filter(Profile.setup_fee_status == "pending_review").scalar() or 0
    approved_profiles = db.query(func.count(Profile.id)).filter(Profile.setup_fee_status == "approved").scalar() or 0
    total_opportunities = db.query(func.count(Opportunity.id)).scalar() or 0

    return DashboardStatsOut(
        total_profiles=total_profiles,
        pending_reviews=pending_reviews,
        approved_profiles=approved_profiles,
        total_opportunities=total_opportunities
    )

class PaymentReviewOut(BaseModel):
    profile_id: str
    name: str
    email: str
    business_name: Optional[str]
    setup_fee_status: str
    setup_fee_proof_url: Optional[str]
    setup_fee_review_note: Optional[str]

    class Config:
        from_attributes = True

@router.get("/profiles/payment-proofs", response_model=List[PaymentReviewOut])
def list_payment_proofs(
    status: Optional[str] = Query(None, description="Filter by status, e.g. pending_review"),
    admin_user: Profile = Depends(get_admin_user), 
    db: Session = Depends(get_db)
):
    query = db.query(Profile)
    if status:
        query = query.filter(Profile.setup_fee_status == status)
    
    profiles = query.all()
    
    return [
        PaymentReviewOut(
            profile_id=str(p.id),
            name=p.name,
            email=p.email,
            business_name=p.business_line,
            setup_fee_status=p.setup_fee_status or "not_submitted",
            setup_fee_proof_url=p.setup_fee_proof_url,
            setup_fee_review_note=p.setup_fee_review_note
        )
        for p in profiles
    ]

@router.post("/profiles/{profile_id}/approve-payment")
def approve_payment(profile_id: str, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "approved"
        profile.is_verified = True
        profile.is_active = True
        
        if not profile.setup_fee_paid_at:
            profile.setup_fee_paid_at = datetime.utcnow()
            
        if not profile.activated_at:
            profile.activated_at = datetime.utcnow()
            
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminApproval",
            description="Admin approved profile setup fee and activated profile.",
            category="financial"
        )
        
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile approved and fully unlocked"}

class RejectPayload(BaseModel):
    review_note: str

@router.post("/profiles/{profile_id}/reject-payment")
def reject_payment(profile_id: str, payload: RejectPayload, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    with replay_transaction(db):
        profile.setup_fee_status = "rejected"
        profile.setup_fee_review_note = payload.review_note
        # Keep false
        profile.is_verified = False
        profile.is_active = False
        
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminRejection",
            description=f"Admin rejected setup fee: {payload.review_note}",
            category="financial"
        )
        
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "Profile rejected with reason"}

class PlanUpdatePayload(BaseModel):
    plan_code: str

@router.patch("/profiles/{profile_id}/plan")
def update_profile_plan(profile_id: str, payload: PlanUpdatePayload, admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    from src.models.constants import PLAN_FEATURES
    
    if payload.plan_code not in PLAN_FEATURES:
        raise HTTPException(status_code=400, detail="Invalid plan code")
        
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    with replay_transaction(db):
        profile.plan_code = payload.plan_code
        if payload.plan_code != "free":
            profile.is_verified = True
        db.flush()
        db.refresh(profile)
        
    return {"status": "success", "plan_code": profile.plan_code}

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str

@router.get("/users", response_model=List[UserOut])
def list_users(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    profiles = db.query(Profile).all()
    return [
        UserOut(
            id=str(p.id),
            name=p.name or "Unnamed",
            email=p.email or "",
            role=p.role or "steward"
        )
        for p in profiles
    ]

@router.post("/users/{profile_id}/promote-admin")
def promote_admin(profile_id: str, admin_user: Profile = Depends(get_bootstrap_admin), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    if getattr(profile, "role", "steward") == "admin":
        return {"status": "success", "message": "Already an admin"}

    with replay_transaction(db):
        profile.role = "admin"
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminPromotion",
            description=f"Promoted to admin by bootstrap admin {admin_user.email}",
            category="system"
        )
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "User promoted to admin"}

@router.post("/users/{profile_id}/demote-admin")
def demote_admin(profile_id: str, admin_user: Profile = Depends(get_bootstrap_admin), db: Session = Depends(get_db)):
    if str(admin_user.id) == profile_id:
        raise HTTPException(status_code=400, detail="Cannot demote yourself")

    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if getattr(profile, "role", "steward") != "admin":
        return {"status": "success", "message": "User is not an admin"}

    with replay_transaction(db):
        profile.role = "steward"
        emit_continuity_event(
            db=db,
            profile_id=profile.id,
            event_type="AdminDemotion",
            description=f"Demoted from admin by bootstrap admin {admin_user.email}",
            category="system"
        )
        db.flush()
        db.refresh(profile)

    return {"status": "success", "message": "User demoted from admin"}


# ============================================================================
# SUPAADMIN TREASURY DASHBOARD & GOVERNANCE
# ============================================================================
class TreasurySummaryOut(BaseModel):
    gross_transaction_volume: float
    platform_fee_revenue: float
    treasury_vault_balance: float
    merchant_earnings_total: float
    merchant_payout_pending: float
    total_orders_count: int
    paid_orders_count: int
    gateway_breakdown: dict
    carrier_breakdown: dict


class TreasuryTransactionOut(BaseModel):
    id: str
    order_number: Optional[str] = None
    buyer_email: Optional[str] = None
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None
    gateway: str
    payment_reference: Optional[str] = None
    total_amount: float
    platform_fee_10pct: float
    merchant_earning_90pct: float
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
    available_balance: float
    pending_payouts_count: int
    currency: str


class SettlementActionRequest(BaseModel):
    settlement_reference: Optional[str] = None
    notes: Optional[str] = None


@router.get("/treasury/summary", response_model=TreasurySummaryOut)
def get_treasury_summary(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Returns platform-wide financial summary across all orders, fee allocations,
    and merchant earning ledgers.
    """
    from src.models.fee_ledger import FeeLedger
    from src.models.treasury_ledger import TreasuryLedger, TreasuryLedgerStatus
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
    from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
    from src.models.order import Order, OrderStatus
    from decimal import Decimal

    gross_volume = db.query(func.coalesce(func.sum(PaymentIntent.amount), 0))\
        .filter(PaymentIntent.status == PaymentIntentStatus.confirmed)\
        .scalar()

    platform_fees = db.query(func.coalesce(func.sum(FeeLedger.platform_fee_amount), 0))\
        .scalar()

    vault_balance = db.query(func.coalesce(func.sum(TreasuryLedger.amount), 0))\
        .filter(TreasuryLedger.status.in_([TreasuryLedgerStatus.allocated, TreasuryLedgerStatus.settled]))\
        .scalar()

    merchant_earnings = db.query(func.coalesce(func.sum(EarningLedger.amount), 0))\
        .scalar()

    payouts_pending = db.query(func.coalesce(func.sum(EarningLedger.amount), 0))\
        .filter(EarningLedger.status == EarningLedgerStatus.available)\
        .scalar()

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    paid_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.paid).scalar() or 0

    gateway_breakdown = {}
    for gw in ["payfast", "paystack", "payjustnow"]:
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

    carrier_breakdown = {}
    for cr in ["courier_guy", "pudo", "pickup"]:
        cr_count = db.query(func.count(Order.id))\
            .filter(Order.shipping_provider == cr, Order.status == OrderStatus.paid)\
            .scalar() or 0
        carrier_breakdown[cr] = {
            "shipment_count": cr_count
        }

    return TreasurySummaryOut(
        gross_transaction_volume=float(gross_volume),
        platform_fee_revenue=float(platform_fees),
        treasury_vault_balance=float(vault_balance),
        merchant_earnings_total=float(merchant_earnings),
        merchant_payout_pending=float(payouts_pending),
        total_orders_count=total_orders,
        paid_orders_count=paid_orders,
        gateway_breakdown=gateway_breakdown,
        carrier_breakdown=carrier_breakdown
    )


@router.get("/treasury/transactions", response_model=List[TreasuryTransactionOut])
def list_treasury_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Paginated real-time ledger feed displaying fee splits and merchant shares.
    """
    from src.models.fee_ledger import FeeLedger
    from src.models.order import Order
    from sqlalchemy import desc

    fee_entries = db.query(FeeLedger)\
        .order_by(desc(FeeLedger.created_at))\
        .offset(offset)\
        .limit(limit)\
        .all()

    results = []
    for fee in fee_entries:
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
            total_amount=float(fee.total_amount),
            platform_fee_10pct=float(fee.platform_fee_amount),
            merchant_earning_90pct=float(fee.provider_amount),
            currency=fee.currency,
            status=fee.status.value if hasattr(fee.status, "value") else str(fee.status),
            created_at=fee.created_at
        ))

    return results


@router.get("/treasury/merchants/payout-queue", response_model=List[PayoutQueueItem])
def get_payout_queue(admin_user: Profile = Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Lists all merchants who have accumulated available earnings ready for bank transfer.
    """
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
    from src.models.merchant_account import MerchantAccount

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
            available_balance=float(total_avail or 0.0),
            pending_payouts_count=entry_count,
            currency="ZAR"
        ))

    return queue


@router.post("/treasury/merchants/{merchant_id}/settle")
def settle_merchant_earnings(
    merchant_id: str,
    payload: SettlementActionRequest,
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Executes settlement of all available earnings for a given merchant,
    transitioning EarningLedger status to 'paid' and emitting an audit event.
    """
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
    from decimal import Decimal

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
        e.notes = f"Settled by Admin {admin_user.email}. Ref: {payload.settlement_reference or 'EFT-BATCH'}"
        total_settled += Decimal(str(e.amount))

    db.commit()

    emit_continuity_event(
        db,
        business_owner_id=merchant_id,
        business_category_key=None,
        business_line=None,
        event_type="merchant_earnings_settled",
        actor_type="admin",
        actor_id=str(admin_user.id),
        related_entity_type="earning_ledger",
        related_entity_id=merchant_id,
        parent_event_id=None,
        payload={
            "merchant_id": merchant_id,
            "total_settled_zar": float(total_settled),
            "entries_settled_count": len(earnings),
            "settlement_reference": payload.settlement_reference or "MANUAL-EFT-SETTLEMENT",
            "settled_by": admin_user.email
        },
        auto_commit=True
    )

    return {
        "status": "success",
        "message": f"Successfully settled R{total_settled} across {len(earnings)} earnings entries.",
        "total_settled": float(total_settled),
        "entries_count": len(earnings)
    }


