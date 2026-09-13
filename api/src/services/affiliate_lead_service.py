import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException

from src.models.lead_offer import AffiliateOffer, AffiliateLead, LeadStatus, PayoutModel
from src.schemas.affiliate_schema import AffiliateLeadCreate, AffiliateConversionPostback
from src.services.continuity_event_service import emit_continuity_event


def validate_lead_eligibility(offer: AffiliateOffer, payload: AffiliateLeadCreate) -> Tuple[bool, Optional[str]]:
    """
    Sheet 2 Strict Pre-Qualification Engine:
    Validates applicant payload against offer criteria (income, age, employment, bank, citizenship, driver license).
    """
    # 1. Income validation
    if offer.min_income is not None:
        if payload.monthly_income is None:
            return False, f"Monthly income required (minimum R{offer.min_income:,.2f})"
        if payload.monthly_income < offer.min_income:
            return False, f"Income of R{payload.monthly_income:,.2f} is below minimum requirement of R{offer.min_income:,.2f}"

    # 2. Employment check
    if offer.requires_employment and payload.is_employed is False:
        return False, "Offer requires stable formal or regular employment"

    # 3. Bank account check
    if offer.requires_bank_account and payload.has_bank_account is False:
        return False, "Offer requires an active transactional South African bank account"

    # 4. South African citizenship check
    if offer.requires_sa_citizen and payload.is_sa_citizen is False:
        return False, "Offer is restricted to South African citizens"

    # 5. Driver's license check (Vehicle tracking / car insurance)
    if offer.requires_driver_license and payload.has_driver_license is False:
        return False, "Offer requires a valid South African driver's license"

    # 6. FICA verification check (e.g. EasyEquities investments requires National ID / Passport)
    if getattr(offer, "requires_fica", False) and not payload.national_id:
        return False, "Offer requires FICA identity verification (South African ID / Passport required)"

    # 7. Age bracket check
    if payload.age is not None:
        if payload.age < offer.min_age:
            return False, f"Applicant age ({payload.age}) is below minimum allowable age of {offer.min_age}"
        if payload.age > offer.max_age:
            return False, f"Applicant age ({payload.age}) exceeds maximum allowable age of {offer.max_age}"

    return True, None


def check_deduplication(
    db: Session,
    offer_id: uuid.UUID,
    phone_number: str,
    national_id: Optional[str],
    dedup_days: int
) -> Tuple[bool, Optional[str]]:
    """
    Enforces deduplication period (default 90 days from Sheet 2).
    Disallows lead submission if same phone or national_id submitted within window.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=dedup_days)

    filters = [
        AffiliateLead.offer_id == offer_id,
        AffiliateLead.created_at >= cutoff,
    ]

    ident_filters = [AffiliateLead.phone_number == phone_number]
    if national_id:
        ident_filters.append(AffiliateLead.national_id == national_id)

    existing = db.query(AffiliateLead).filter(
        and_(*filters, or_(*ident_filters))
    ).first()

    if existing:
        return False, f"Duplicate lead detected within {dedup_days}-day window (Previous Lead ID: {existing.id})"

    return True, None


def submit_affiliate_lead(
    db: Session,
    merchant_id: str,
    payload: AffiliateLeadCreate
) -> AffiliateLead:
    """
    Orchestrates pre-qualification, deduplication, persistence, and audit timeline event emission.
    """
    offer = db.query(AffiliateOffer).filter(
        AffiliateOffer.id == payload.offer_id,
        AffiliateOffer.is_active == True
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Affiliate offer not found or inactive")

    # 1. Deduplication check
    is_unique, dedup_reason = check_deduplication(
        db=db,
        offer_id=offer.id,
        phone_number=payload.phone_number,
        national_id=payload.national_id,
        dedup_days=offer.dedup_period_days
    )

    if not is_unique:
        lead = AffiliateLead(
            offer_id=offer.id,
            merchant_id=merchant_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone_number=payload.phone_number,
            email=payload.email,
            national_id=payload.national_id,
            monthly_income=payload.monthly_income,
            is_employed=payload.is_employed,
            has_bank_account=payload.has_bank_account,
            is_sa_citizen=payload.is_sa_citizen,
            has_driver_license=payload.has_driver_license,
            age=payload.age,
            status=LeadStatus.REJECTED.value,
            disqualification_reason=dedup_reason,
            customer_metadata=payload.customer_metadata
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

        emit_continuity_event(
            db=db,
            business_owner_id=merchant_id,
            business_category_key="affiliate_distribution",
            business_line="auxiliary_revenue",
            event_type="affiliate_lead_rejected",
            actor_type="system",
            actor_id=merchant_id,
            related_entity_type="affiliate_lead",
            related_entity_id=str(lead.id),
            title="Affiliate Lead Rejected (Duplicate)",
            description=dedup_reason,
            payload={"offer_slug": offer.slug, "reason": dedup_reason},
            auto_commit=True
        )
        raise HTTPException(status_code=400, detail=dedup_reason)

    # 2. Eligibility evaluation
    is_eligible, failure_reason = validate_lead_eligibility(offer, payload)

    status = LeadStatus.QUALIFIED.value if is_eligible else LeadStatus.REJECTED.value

    lead = AffiliateLead(
        offer_id=offer.id,
        merchant_id=merchant_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        email=payload.email,
        national_id=payload.national_id,
        monthly_income=payload.monthly_income,
        is_employed=payload.is_employed,
        has_bank_account=payload.has_bank_account,
        is_sa_citizen=payload.is_sa_citizen,
        has_driver_license=payload.has_driver_license,
        age=payload.age,
        status=status,
        disqualification_reason=failure_reason,
        customer_metadata=payload.customer_metadata
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    # 3. Emit immutable continuity audit event
    event_type = "affiliate_lead_qualified" if is_eligible else "affiliate_lead_disqualified"
    emit_continuity_event(
        db=db,
        business_owner_id=merchant_id,
        business_category_key="affiliate_distribution",
        business_line="auxiliary_revenue",
        event_type=event_type,
        actor_type="merchant",
        actor_id=merchant_id,
        related_entity_type="affiliate_lead",
        related_entity_id=str(lead.id),
        title=f"Affiliate Lead {status.title()} ({offer.name})",
        description=failure_reason or f"Pre-qualified customer submitted for {offer.name}",
        payload={
            "offer_slug": offer.slug,
            "offer_name": offer.name,
            "customer_phone": payload.phone_number,
            "status": status,
            "disqualification_reason": failure_reason
        },
        auto_commit=True
    )

    if not is_eligible:
        raise HTTPException(status_code=422, detail=f"Lead disqualified: {failure_reason}")

    return lead


def calculate_offer_commission(
    offer: AffiliateOffer,
    gross_amount: Optional[Decimal] = None,
    conversion_rate: Optional[Decimal] = None
) -> Tuple[Decimal, Decimal, Decimal]:
    """
    Computes (gross_commission, merchant_share, platform_share) based on PayoutModel and Sheet 1/2 formulas.
    Default merchant_split_ratio = 70%.
    """
    split = offer.merchant_split_ratio or Decimal("0.70")
    gross = Decimal("0.00")

    if offer.payout_model == PayoutModel.CPA.value or offer.payout_model == PayoutModel.CPL.value:
        gross = Decimal(str(offer.base_payout))

    elif offer.payout_model == PayoutModel.CPS.value:
        if gross_amount is not None and offer.payout_percentage is not None:
            gross = gross_amount * Decimal(str(offer.payout_percentage))
        else:
            gross = Decimal(str(offer.base_payout))

    elif offer.payout_model == PayoutModel.TIERED_CPL.value:
        # Evaluate dynamic CR% tier rules (e.g. Dis-Chem Funeral / Life)
        if offer.payout_tier_rules and conversion_rate is not None:
            cr_val = float(conversion_rate)
            matched_payout = 0.0
            for tier in offer.payout_tier_rules:
                if tier.get("cr_min", 0.0) <= cr_val <= tier.get("cr_max", 1.0):
                    matched_payout = tier.get("payout", 0.0)
                    break
            gross = Decimal(str(matched_payout))
        else:
            gross = Decimal(str(offer.base_payout))

    elif offer.payout_model == PayoutModel.HYBRID.value:
        # e.g. Sanlam RA: R10 CPL + R250 CPA
        gross = Decimal(str(offer.base_payout))

    merchant_share = (gross * split).quantize(Decimal("0.01"))
    platform_share = (gross - merchant_share).quantize(Decimal("0.01"))

    return gross, merchant_share, platform_share


def process_conversion_postback(
    db: Session,
    postback: AffiliateConversionPostback
) -> AffiliateLead:
    """
    Handles S2S / webhook postbacks:
    1. Resolves target lead via ID, external ID, phone, or national ID.
    2. Calculates gross and merchant commissions.
    3. Emits 'commission_approved' / 'commission_paid' continuity events (hydrating commissions ledger).
    4. Updates lead record with attribution numbers and status.
    """
    query = db.query(AffiliateLead)

    if postback.lead_id:
        query = query.filter(AffiliateLead.id == postback.lead_id)
    elif postback.external_lead_id:
        query = query.filter(AffiliateLead.external_lead_id == postback.external_lead_id)
    elif postback.phone_number:
        query = query.filter(AffiliateLead.phone_number == postback.phone_number)
    elif postback.national_id:
        query = query.filter(AffiliateLead.national_id == postback.national_id)
    else:
        raise HTTPException(status_code=400, detail="Missing identification parameters for conversion attribution")

    lead = query.order_by(AffiliateLead.created_at.desc()).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Matching affiliate lead not found for attribution")

    offer = db.query(AffiliateOffer).filter(AffiliateOffer.id == lead.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Associated affiliate offer not found")

    if postback.status.upper() in ["REJECTED", "DECLINED", "FAILED"]:
        lead.status = LeadStatus.REJECTED.value
        lead.disqualification_reason = "Partner rejected conversion"
        db.commit()
        db.refresh(lead)

        emit_continuity_event(
            db=db,
            business_owner_id=lead.merchant_id,
            business_category_key="affiliate_distribution",
            business_line="auxiliary_revenue",
            event_type="affiliate_conversion_rejected",
            actor_type="partner_webhook",
            actor_id=offer.client_name,
            related_entity_type="affiliate_lead",
            related_entity_id=str(lead.id),
            title=f"Affiliate Conversion Rejected ({offer.name})",
            description=f"Partner declined conversion for {offer.name}",
            payload={"lead_id": str(lead.id), "offer_slug": offer.slug},
            auto_commit=True
        )
        return lead

    # Calculate financial split
    gross, merchant_share, platform_share = calculate_offer_commission(
        offer=offer,
        gross_amount=postback.gross_amount,
        conversion_rate=postback.conversion_rate
    )

    lead.status = LeadStatus.CONVERTED.value
    lead.converted_at = datetime.now(timezone.utc)
    lead.gross_commission = gross
    lead.merchant_commission = merchant_share
    lead.platform_fee = platform_share
    if postback.conversion_reference:
        lead.external_lead_id = postback.conversion_reference

    db.commit()
    db.refresh(lead)

    # Emit commission_approved and commission_paid events to hydrate commissions ledger
    # Note: src/routers/commissions.py consumes "commission_approved" and "commission_paid" with payload amount
    emit_continuity_event(
        db=db,
        business_owner_id=lead.merchant_id,
        business_category_key="affiliate_distribution",
        business_line="auxiliary_revenue",
        event_type="commission_approved",
        actor_type="partner_webhook",
        actor_id=offer.client_name,
        related_entity_type="affiliate_lead",
        related_entity_id=str(lead.id),
        title=f"Affiliate Commission Approved: {offer.name}",
        description=f"Merchant earned R{merchant_share:,.2f} commission from {offer.name}",
        payload={
            "lead_id": str(lead.id),
            "offer_slug": offer.slug,
            "gross_amount": float(gross),
            "amount": float(merchant_share),
            "platform_fee": float(platform_share),
            "reference": postback.conversion_reference
        },
        auto_commit=True
    )

    emit_continuity_event(
        db=db,
        business_owner_id=lead.merchant_id,
        business_category_key="affiliate_distribution",
        business_line="auxiliary_revenue",
        event_type="commission_paid",
        actor_type="partner_webhook",
        actor_id=offer.client_name,
        related_entity_type="affiliate_lead",
        related_entity_id=str(lead.id),
        title=f"Affiliate Commission Paid: {offer.name}",
        description=f"Paid R{merchant_share:,.2f} to merchant ledger",
        payload={
            "lead_id": str(lead.id),
            "offer_slug": offer.slug,
            "amount": float(merchant_share),
            "currency": "ZAR"
        },
        auto_commit=True
    )

    return lead
