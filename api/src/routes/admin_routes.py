from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

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
    from src.models.merchant_account import MerchantAccount
    from decimal import Decimal

    # 1. Payout Eligibility & KYC Protection
    m_account = db.query(MerchantAccount).filter(MerchantAccount.user_id == merchant_id).first()
    if not m_account or not m_account.payout_enabled:
        raise HTTPException(
            status_code=403,
            detail="Payout rejected: Merchant account is unverified or payouts are disabled. FICA KYC review required."
        )

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


# ----------------------------------------------------------------------------
# 3B. ADMIN KYC REVIEW & VERIFICATION QUEUE WITH SLA & ESCALATIONS
# ----------------------------------------------------------------------------
class SLAStatusEnum(str, Enum):
    on_track = "on_track"              # < 48 hours
    approaching_sla = "approaching_sla"  # 48 - 72 hours
    breached = "breached"              # > 72 hours


class MerchantKYCItem(BaseModel):
    merchant_id: str
    merchant_name: str
    email: Optional[str] = None
    verification_status: str
    id_document_url: Optional[str] = None
    proof_of_address_url: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_number: Optional[str] = None
    payout_enabled: bool
    created_at: datetime
    # SLA Urgency & Reminder Metrics
    pending_hours: float = 0.0
    sla_status: SLAStatusEnum = SLAStatusEnum.on_track
    unclaimed_balance: float = 0.0
    requires_nudge: bool = False


class KYCReviewActionRequest(BaseModel):
    action: str  # "approve" | "reject"
    notes: Optional[str] = None


class KYCNudgeRequest(BaseModel):
    message: Optional[str] = "Please provide clear, legible copies of your ID and proof of address to enable payout settlements."


class EscalationReportOut(BaseModel):
    scanned_merchants: int
    sla_breaches_detected: int
    unverified_nudges_triggered: int
    stale_balance_alarms: int
    events_emitted: int
    details: List[Dict[str, Any]]


@router.get("/merchants/kyc-queue", response_model=List[MerchantKYCItem])
def get_merchant_kyc_queue(
    status: Optional[str] = Query(None, description="Filter by status e.g. pending_review, verified"),
    sort_by_urgency: bool = Query(True, description="Sort breached and urgent reviews to the top"),
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Returns merchants awaiting FICA compliance / KYC document review,
    enriched with calculated SLA turn-around times and frozen liability balances.
    """
    from src.models.merchant_account import MerchantAccount, MerchantVerificationStatus
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus

    query = db.query(MerchantAccount)
    if status:
        query = query.filter(MerchantAccount.verification_status == status)
    else:
        query = query.filter(MerchantAccount.verification_status.in_([
            MerchantVerificationStatus.pending_review,
            MerchantVerificationStatus.unverified
        ]))

    accounts = query.all()
    results = []
    now = datetime.utcnow()

    for acc in accounts:
        merchant = db.query(Profile).filter((Profile.owner_id == acc.user_id) | (Profile.id == acc.user_id)).first()
        created = acc.created_at.replace(tzinfo=None) if acc.created_at else now
        pending_hours = max(0.0, round((now - created).total_seconds() / 3600.0, 1))

        # Determine SLA Urgency
        v_status = acc.verification_status.value if hasattr(acc.verification_status, "value") else str(acc.verification_status)
        if v_status == "pending_review":
            if pending_hours > 72.0:
                sla_status = SLAStatusEnum.breached
            elif pending_hours >= 48.0:
                sla_status = SLAStatusEnum.approaching_sla
            else:
                sla_status = SLAStatusEnum.on_track
        else:
            sla_status = SLAStatusEnum.on_track

        # Calculate unclaimed pending balance
        unclaimed_bal = db.query(func.coalesce(func.sum(EarningLedger.amount), 0)).filter(
            EarningLedger.user_id == acc.user_id,
            EarningLedger.status == EarningLedgerStatus.available
        ).scalar() or Decimal("0.00")

        requires_nudge = (v_status == "unverified" and pending_hours >= 72.0) or (float(unclaimed_bal) > 0 and not acc.payout_enabled)

        results.append(MerchantKYCItem(
            merchant_id=str(acc.user_id),
            merchant_name=merchant.name if merchant else "Registered Merchant",
            email=merchant.email if merchant else None,
            verification_status=v_status,
            id_document_url=acc.id_document_url,
            proof_of_address_url=acc.proof_of_address_url,
            business_registration_number=acc.business_registration_number,
            tax_number=acc.tax_number,
            payout_enabled=acc.payout_enabled,
            created_at=acc.created_at,
            pending_hours=pending_hours,
            sla_status=sla_status,
            unclaimed_balance=float(unclaimed_bal),
            requires_nudge=requires_nudge
        ))

    if sort_by_urgency:
        urgency_map = {SLAStatusEnum.breached: 0, SLAStatusEnum.approaching_sla: 1, SLAStatusEnum.on_track: 2}
        results.sort(key=lambda x: (urgency_map.get(x.sla_status, 3), -x.pending_hours))
    else:
        results.sort(key=lambda x: x.created_at, reverse=True)

    return results


@router.post("/merchants/{merchant_id}/kyc-review")
def review_merchant_kyc(
    merchant_id: str,
    payload: KYCReviewActionRequest,
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Approves or rejects a merchant's KYC submission.
    Approving unlocks payout_enabled for automated or manual settlements.
    """
    from src.models.merchant_account import MerchantAccount, MerchantVerificationStatus

    m_account = db.query(MerchantAccount).filter(MerchantAccount.user_id == merchant_id).first()
    if not m_account:
        raise HTTPException(status_code=404, detail="Merchant account not found")

    if payload.action == "approve":
        m_account.verification_status = MerchantVerificationStatus.verified
        m_account.payout_enabled = True
        m_account.verified_by = admin_user.email
        m_account.verification_timestamp = datetime.utcnow()
        m_account.kyc_review_notes = payload.notes or "KYC approved by compliance admin"
        event_name = "merchant_kyc_approved"
    elif payload.action == "reject":
        m_account.verification_status = MerchantVerificationStatus.rejected
        m_account.payout_enabled = False
        m_account.kyc_review_notes = payload.notes or "KYC documentation rejected"
        event_name = "merchant_kyc_rejected"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    db.commit()

    emit_continuity_event(
        db,
        business_owner_id=merchant_id,
        business_category_key=None,
        business_line=None,
        event_type=event_name,
        actor_type="admin",
        actor_id=str(admin_user.id),
        related_entity_type="merchant_account",
        related_entity_id=str(m_account.id),
        parent_event_id=None,
        payload={
            "merchant_id": merchant_id,
            "action": payload.action,
            "verified_by": admin_user.email,
            "notes": payload.notes,
            "payout_enabled": m_account.payout_enabled
        },
        auto_commit=True
    )

    return {
        "status": "success",
        "action": payload.action,
        "verification_status": m_account.verification_status.value,
        "payout_enabled": m_account.payout_enabled,
        "notes": m_account.kyc_review_notes
    }


@router.post("/merchants/{merchant_id}/kyc-nudge")
def nudge_merchant_kyc(
    merchant_id: str,
    payload: KYCNudgeRequest,
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Sends an automated compliance nudge to the merchant to provide or update
    their FICA documentation.
    """
    from src.models.merchant_account import MerchantAccount

    m_account = db.query(MerchantAccount).filter(MerchantAccount.user_id == merchant_id).first()
    if not m_account:
        raise HTTPException(status_code=404, detail="Merchant account not found")

    m_account.kyc_review_notes = f"Nudge sent on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}: {payload.message}"
    db.commit()

    emit_continuity_event(
        db,
        business_owner_id=merchant_id,
        business_category_key=None,
        business_line=None,
        event_type="merchant_kyc_nudged",
        actor_type="admin",
        actor_id=str(admin_user.id),
        related_entity_type="merchant_account",
        related_entity_id=str(m_account.id),
        parent_event_id=None,
        payload={
            "merchant_id": merchant_id,
            "admin_email": admin_user.email,
            "message": payload.message
        },
        auto_commit=True
    )

    return {
        "status": "success",
        "message": "Merchant compliance nudge dispatched successfully."
    }


@router.post("/compliance/escalations/trigger", response_model=EscalationReportOut)
def trigger_compliance_escalations(
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Automated Governance Scanner:
    1. Scans pending KYC submissions exceeding the 72h SLA and emits compliance_sla_breached.
    2. Identifies unverified merchants with pending earnings holding frozen balances > R500.
    3. Triggers compliance alerts for immutable audit replay.
    """
    from src.models.merchant_account import MerchantAccount, MerchantVerificationStatus
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus

    now = datetime.utcnow()
    seventy_two_hours_ago = now - timedelta(hours=72)
    seven_days_ago = now - timedelta(days=7)

    accounts = db.query(MerchantAccount).all()
    sla_breaches = 0
    unverified_nudges = 0
    stale_alarms = 0
    events_count = 0
    details = []

    for acc in accounts:
        v_status = acc.verification_status.value if hasattr(acc.verification_status, "value") else str(acc.verification_status)
        created = acc.created_at.replace(tzinfo=None) if acc.created_at else now

        # Rule 1: Admin SLA Breach (pending_review > 72h)
        if v_status == "pending_review" and created < seventy_two_hours_ago:
            sla_breaches += 1
            hours_elapsed = round((now - created).total_seconds() / 3600.0, 1)
            details.append({
                "type": "admin_sla_breach",
                "merchant_id": str(acc.user_id),
                "hours_elapsed": hours_elapsed,
                "message": f"Merchant KYC pending review for {hours_elapsed}h (exceeds 72h SLA)"
            })
            emit_continuity_event(
                db,
                business_owner_id=str(acc.user_id),
                business_category_key=None,
                business_line=None,
                event_type="compliance_sla_breached",
                actor_type="system",
                actor_id="compliance_engine",
                related_entity_type="merchant_account",
                related_entity_id=str(acc.id),
                parent_event_id=None,
                payload={
                    "merchant_id": str(acc.user_id),
                    "hours_elapsed": hours_elapsed,
                    "created_at": created.isoformat()
                },
                auto_commit=False
            )
            events_count += 1

        # Rule 2: Stale Payout Balance (> R500 locked for > 7 days)
        unclaimed = db.query(func.coalesce(func.sum(EarningLedger.amount), 0)).filter(
            EarningLedger.user_id == acc.user_id,
            EarningLedger.status == EarningLedgerStatus.available,
            EarningLedger.created_at < seven_days_ago
        ).scalar() or Decimal("0.00")

        if float(unclaimed) >= 500.0 and not acc.payout_enabled:
            stale_alarms += 1
            details.append({
                "type": "stale_payout_liability",
                "merchant_id": str(acc.user_id),
                "amount": float(unclaimed),
                "message": f"R{unclaimed} held in unverified merchant account for > 7 days"
            })
            emit_continuity_event(
                db,
                business_owner_id=str(acc.user_id),
                business_category_key=None,
                business_line=None,
                event_type="compliance_stale_liability_alert",
                actor_type="system",
                actor_id="compliance_engine",
                related_entity_type="merchant_account",
                related_entity_id=str(acc.id),
                parent_event_id=None,
                payload={
                    "merchant_id": str(acc.user_id),
                    "amount": float(unclaimed)
                },
                auto_commit=False
            )
            events_count += 1

        # Rule 3: Merchant Unverified Nudge (> 3 days unverified with earnings)
        if v_status == "unverified" and created < seventy_two_hours_ago and float(unclaimed) > 0:
            unverified_nudges += 1
            details.append({
                "type": "merchant_kyc_nudge_required",
                "merchant_id": str(acc.user_id),
                "amount": float(unclaimed),
                "message": "Nudge flagged to submit FICA documents"
            })

    db.commit()

    return EscalationReportOut(
        scanned_merchants=len(accounts),
        sla_breaches_detected=sla_breaches,
        unverified_nudges_triggered=unverified_nudges,
        stale_balance_alarms=stale_alarms,
        events_emitted=events_count,
        details=details
    )


# ----------------------------------------------------------------------------
# 4. EXECUTIVE ANALYTICS & DISBURSEMENT VELOCITY
# ----------------------------------------------------------------------------
class RevenueTrendItem(BaseModel):
    date: str
    gross_volume: float
    platform_fee: float
    merchant_share: float
    order_count: int


class PayoutVelocityMetrics(BaseModel):
    avg_payout_turnaround_hours: float
    settled_last_7_days: float
    settled_last_30_days: float
    active_earning_merchants: int


class GatewayPerformanceItem(BaseModel):
    provider: str
    total_volume: float
    transaction_count: int
    success_rate: float
    average_order_value: float


class CarrierDistributionItem(BaseModel):
    carrier: str
    shipment_count: int
    percentage: float


class TreasuryAnalyticsOut(BaseModel):
    time_range: str
    revenue_trends: List[RevenueTrendItem]
    payout_velocity: PayoutVelocityMetrics
    gateway_performance: List[GatewayPerformanceItem]
    carrier_distribution: List[CarrierDistributionItem]


@router.get("/treasury/analytics", response_model=TreasuryAnalyticsOut)
def get_treasury_analytics(
    range: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    admin_user: Profile = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Returns time-series revenue trends, disbursement velocity, gateway comparison,
    and carrier logistics distribution for executive governance.
    """
    from src.models.order import Order, OrderStatus
    from src.models.fee_ledger import FeeLedger
    from src.models.earning_ledger import EarningLedger, EarningLedgerStatus
    from datetime import datetime, timedelta
    from decimal import Decimal

    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map.get(range, 30)
    start_date = datetime.utcnow() - timedelta(days=days)

    # 1. Query Orders in Time Window
    orders = db.query(Order).filter(
        Order.status == OrderStatus.paid,
        Order.created_at >= start_date
    ).all()

    # Aggregate by Date
    daily_buckets = {}
    for i in range(days):
        day_str = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
        daily_buckets[day_str] = {
            "date": day_str,
            "gross_volume": Decimal("0.00"),
            "platform_fee": Decimal("0.00"),
            "merchant_share": Decimal("0.00"),
            "order_count": 0
        }

    for ord in orders:
        if ord.created_at:
            d_key = ord.created_at.strftime("%Y-%m-%d")
            if d_key in daily_buckets:
                amt = Decimal(str(ord.total_amount or 0.0))
                p_fee = round(amt * Decimal("0.10"), 2)
                m_share = amt - p_fee
                daily_buckets[d_key]["gross_volume"] += amt
                daily_buckets[d_key]["platform_fee"] += p_fee
                daily_buckets[d_key]["merchant_share"] += m_share
                daily_buckets[d_key]["order_count"] += 1

    revenue_trends = [
        RevenueTrendItem(
            date=v["date"],
            gross_volume=float(v["gross_volume"]),
            platform_fee=float(v["platform_fee"]),
            merchant_share=float(v["merchant_share"]),
            order_count=v["order_count"]
        )
        for v in sorted(daily_buckets.values(), key=lambda x: x["date"])
    ]

    # 2. Payout Velocity Calculations
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    settled_7d = db.query(func.coalesce(func.sum(EarningLedger.amount), 0)).filter(
        EarningLedger.status == EarningLedgerStatus.paid,
        EarningLedger.paid_at >= seven_days_ago
    ).scalar()

    settled_30d = db.query(func.coalesce(func.sum(EarningLedger.amount), 0)).filter(
        EarningLedger.status == EarningLedgerStatus.paid,
        EarningLedger.paid_at >= thirty_days_ago
    ).scalar()

    active_merchants_count = db.query(func.count(func.distinct(EarningLedger.user_id))).filter(
        EarningLedger.created_at >= thirty_days_ago
    ).scalar() or 0

    # Calculate average turnaround time from pending_at to paid_at
    paid_entries = db.query(EarningLedger).filter(
        EarningLedger.status == EarningLedgerStatus.paid,
        EarningLedger.paid_at.isnot(None),
        EarningLedger.created_at >= thirty_days_ago
    ).limit(100).all()

    avg_turnaround_hours = 12.0  # Safe standard default
    if paid_entries:
        total_hours = sum((p.paid_at.replace(tzinfo=None) - p.created_at.replace(tzinfo=None)).total_seconds() / 3600.0 for p in paid_entries)
        avg_turnaround_hours = round(total_hours / len(paid_entries), 1)

    payout_velocity = PayoutVelocityMetrics(
        avg_payout_turnaround_hours=max(0.5, avg_turnaround_hours),
        settled_last_7_days=float(settled_7d),
        settled_last_30_days=float(settled_30d),
        active_earning_merchants=active_merchants_count
    )

    # 3. Gateway Performance
    gateways = ["payfast", "paystack", "payjustnow"]
    gateway_performance = []
    for gw in gateways:
        total_orders_gw = db.query(func.count(Order.id)).filter(
            Order.payment_provider == gw,
            Order.created_at >= start_date
        ).scalar() or 0
        paid_orders_gw = db.query(func.count(Order.id)).filter(
            Order.payment_provider == gw,
            Order.status == OrderStatus.paid,
            Order.created_at >= start_date
        ).scalar() or 0
        volume_gw = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.payment_provider == gw,
            Order.status == OrderStatus.paid,
            Order.created_at >= start_date
        ).scalar() or Decimal("0.00")

        success_rate = round((paid_orders_gw / total_orders_gw * 100.0), 1) if total_orders_gw > 0 else 100.0
        aov = round(float(volume_gw) / paid_orders_gw, 2) if paid_orders_gw > 0 else 0.0

        gateway_performance.append(GatewayPerformanceItem(
            provider=gw,
            total_volume=float(volume_gw),
            transaction_count=paid_orders_gw,
            success_rate=success_rate,
            average_order_value=aov
        ))

    # 4. Carrier Logistics Distribution
    carriers = ["courier_guy", "pudo", "pickup"]
    total_shipments = db.query(func.count(Order.id)).filter(
        Order.status == OrderStatus.paid,
        Order.created_at >= start_date
    ).scalar() or 0

    carrier_distribution = []
    for cr in carriers:
        count_cr = db.query(func.count(Order.id)).filter(
            Order.shipping_provider == cr,
            Order.status == OrderStatus.paid,
            Order.created_at >= start_date
        ).scalar() or 0
        pct = round((count_cr / total_shipments * 100.0), 1) if total_shipments > 0 else 0.0
        carrier_distribution.append(CarrierDistributionItem(
            carrier=cr,
            shipment_count=count_cr,
            percentage=pct
        ))

    return TreasuryAnalyticsOut(
        time_range=range,
        revenue_trends=revenue_trends,
        payout_velocity=payout_velocity,
        gateway_performance=gateway_performance,
        carrier_distribution=carrier_distribution
    )



