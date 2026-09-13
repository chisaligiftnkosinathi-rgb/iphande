import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.auth.supabase_auth import get_current_user
from src.models.lead_offer import AffiliateOffer, AffiliateLead
from src.schemas.affiliate_schema import (
    AffiliateOfferOut,
    AffiliateLeadCreate,
    AffiliateLeadOut,
    AffiliateConversionPostback,
)
from src.services.affiliate_lead_service import (
    submit_affiliate_lead,
    process_conversion_postback,
)

router = APIRouter(prefix="/api/v1/affiliates", tags=["affiliates"])


@router.get("/offers", response_model=List[AffiliateOfferOut])
def list_affiliate_offers(
    category: Optional[str] = Query(None, description="Filter by category: LOANS, FUNERAL, MEDICAL, VEHICLE, RETAIL, INVESTMENTS"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """
    Returns active affiliate commercial offers with full payout models and pre-qualification criteria.
    """
    query = db.query(AffiliateOffer).filter(AffiliateOffer.is_active == is_active)
    if category:
        query = query.filter(AffiliateOffer.category == category.upper())
    return query.order_by(AffiliateOffer.category, AffiliateOffer.name).all()


@router.get("/offers/{offer_id}", response_model=AffiliateOfferOut)
def get_affiliate_offer(
    offer_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Fetches a specific affiliate offer with targeting constraints and dynamic payout rules.
    """
    offer = db.query(AffiliateOffer).filter(AffiliateOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Affiliate offer not found")
    return offer


@router.post("/leads/submit", response_model=AffiliateLeadOut, status_code=status.HTTP_201_CREATED)
def submit_lead(
    payload: AffiliateLeadCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Submits a customer lead for an affiliate product:
    - Pre-qualifies against Sheet 2 rules (Income, Age, Employment, SA Citizen, Bank Account, Driver License).
    - Enforces 90-day deduplication window.
    - Tags merchant account attribution.
    - Emits immutable continuity audit event.
    """
    merchant_id = current_user.get("uid") or current_user.get("sub")
    if not merchant_id:
        raise HTTPException(status_code=401, detail="Merchant identity required for lead attribution")

    lead = submit_affiliate_lead(
        db=db,
        merchant_id=str(merchant_id),
        payload=payload
    )
    return lead


@router.get("/leads/my-leads", response_model=List[AffiliateLeadOut])
def list_my_leads(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Lists submitted affiliate leads for the authenticated merchant with conversion and payout attribution.
    """
    merchant_id = current_user.get("uid") or current_user.get("sub")
    if not merchant_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return db.query(AffiliateLead).filter(
        AffiliateLead.merchant_id == str(merchant_id)
    ).order_by(AffiliateLead.created_at.desc()).all()


@router.post("/postback", response_model=AffiliateLeadOut)
def handle_conversion_postback(
    payload: AffiliateConversionPostback,
    db: Session = Depends(get_db)
):
    """
    S2S / Webhook postback endpoint for conversion attribution:
    - Matches lead by lead_id, external_lead_id, phone, or national_id.
    - Computes merchant commission split (70% standard).
    - Emits 'commission_approved' and 'commission_paid' continuity events to credit merchant ledger.
    """
    return process_conversion_postback(db=db, postback=payload)
