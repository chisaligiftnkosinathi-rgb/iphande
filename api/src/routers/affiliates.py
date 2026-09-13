import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.auth.supabase_auth import get_current_user, require_supaadmin
from src.models.lead_offer import AffiliateOffer, AffiliateLead
from src.schemas.affiliate_schema import (
    AffiliateOfferOut,
    AffiliateLeadCreate,
    AffiliateLeadOut,
    AffiliateConversionPostback,
    AffiliateStatementIngest,
    AffiliateStatementOut,
    VehicleFunnelLeadCreate,
    VehicleFunnelLeadOut,
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


@router.get("/click/{offer_slug}")
def track_affiliate_click(
    offer_slug: str,
    merchant_id: str = Query(..., description="Merchant Profile/User ID for attribution"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Dynamic tracking click generator:
    - Resolves offer by slug (e.g. hostafrica-cloud-domains, easyequities-invest).
    - Records an immutable AffiliateClick event with visitor IP and merchant attribution.
    - Redirects (HTTP 302) to the partner referral URL with sub_id / tracking code.
    """
    from src.models.lead_offer import AffiliateClick
    from fastapi.responses import RedirectResponse

    offer = db.query(AffiliateOffer).filter(
        AffiliateOffer.slug == offer_slug,
        AffiliateOffer.is_active == True
    ).first()

    if not offer or not offer.affiliate_base_url:
        raise HTTPException(status_code=404, detail="Active affiliate referral link not configured for this offer")

    # Construct tracking URL with merchant sub_id if applicable
    target_url = offer.affiliate_base_url
    if "hostafrica.com" in target_url:
        # e.g. https://my.hostafrica.com/aff.php?aff=3635&subid=MERCHANT_ID
        sep = "&" if "?" in target_url else "?"
        target_url = f"{target_url}{sep}subid={merchant_id}"
    elif "bit.ly" in target_url or "easyequities.co.za" in target_url:
        # e.g. EasyEquities Bitly or registration link
        sep = "&" if "?" in target_url else "?"
        target_url = f"{target_url}{sep}ref_merchant={merchant_id}"

    # Log outbound click event
    visitor_ip = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None

    click = AffiliateClick(
        offer_id=offer.id,
        offer_slug=offer.slug,
        merchant_id=merchant_id,
        visitor_ip=visitor_ip,
        user_agent=user_agent[:255] if user_agent else None,
        target_url=target_url
    )
    db.add(click)
    db.commit()

    return RedirectResponse(url=target_url, status_code=status.HTTP_302_FOUND)


@router.get("/referral-link/{offer_slug}")
def get_merchant_referral_link(
    offer_slug: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the trackable proxy URL for the authenticated merchant to share via WhatsApp/SMS.
    """
    merchant_id = current_user.get("uid") or current_user.get("sub")
    if not merchant_id:
        raise HTTPException(status_code=401, detail="Merchant identity required")

    offer = db.query(AffiliateOffer).filter(
        AffiliateOffer.slug == offer_slug,
        AffiliateOffer.is_active == True
    ).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    from src.config import settings
    base_api = getattr(settings, "AXIONYX_API_URL", "https://api.iphande.co.za")
    trackable_url = f"{base_api}/api/v1/affiliates/click/{offer.slug}?merchant_id={merchant_id}"

    # Suggested promotional copy
    promo_text = f"Check out {offer.name}! Sign up via my link: {trackable_url}"
    if offer_slug == "easyequities-invest":
        promo_text = f"Start building wealth with EasyEquities! Invest in top SA & US shares from R10 and get a R50 starter voucher: {trackable_url} (Ts&Cs apply)"
    elif offer_slug == "hostafrica-cloud-domains":
        promo_text = f"Register your custom business .co.za domain and branded email with HOSTAFRICA: {trackable_url}"

    return {
        "offer_slug": offer.slug,
        "offer_name": offer.name,
        "trackable_url": trackable_url,
        "destination_url": offer.affiliate_base_url,
        "promotional_copy": promo_text
    }


@router.post("/statements/ingest", response_model=AffiliateStatementOut)
def ingest_affiliate_monthly_statement(
    payload: AffiliateStatementIngest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_supaadmin)
):
    """
    Admin reconciliation endpoint for monthly affiliate reports (HOSTAFRICA, EasyEquities):
    - Records statement in affiliate_partner_statements.
    - Emits 'affiliate_statement_reconciled' continuity event.
    - Emits financial event logging platform auxiliary revenue inflow.
    """
    from src.models.lead_offer import AffiliatePartnerStatement
    from src.services.continuity_event_service import emit_continuity_event

    existing = db.query(AffiliatePartnerStatement).filter(
        AffiliatePartnerStatement.partner == payload.partner.upper(),
        AffiliatePartnerStatement.reporting_period == payload.reporting_period
    ).first()

    if existing:
        existing.total_earnings = payload.total_earnings
        existing.withdrawn_amount = payload.withdrawn_amount
        existing.total_visitors = payload.total_visitors
        existing.new_signups = payload.new_signups
        existing.payout_account_id = payload.payout_account_id
        existing.notes = payload.notes
        statement = existing
    else:
        statement = AffiliatePartnerStatement(
            partner=payload.partner.upper(),
            reporting_period=payload.reporting_period,
            total_earnings=payload.total_earnings,
            withdrawn_amount=payload.withdrawn_amount,
            total_visitors=payload.total_visitors,
            new_signups=payload.new_signups,
            payout_account_id=payload.payout_account_id,
            notes=payload.notes
        )
        db.add(statement)

    db.commit()
    db.refresh(statement)

    admin_id = current_user.get("uid", "admin")
    emit_continuity_event(
        db=db,
        business_owner_id="platform_treasury",
        business_category_key="affiliate_distribution",
        business_line="auxiliary_revenue",
        event_type="affiliate_statement_reconciled",
        actor_type="supaadmin",
        actor_id=str(admin_id),
        related_entity_type="affiliate_partner_statement",
        related_entity_id=str(statement.id),
        title=f"Affiliate Statement Reconciled: {statement.partner} ({statement.reporting_period})",
        description=f"Reconciled R{statement.total_earnings:,.2f} auxiliary earnings from {statement.partner}",
        payload={
            "partner": statement.partner,
            "reporting_period": statement.reporting_period,
            "total_earnings": float(statement.total_earnings),
            "withdrawn_amount": float(statement.withdrawn_amount),
            "new_signups": statement.new_signups,
            "total_visitors": statement.total_visitors
        },
        auto_commit=True
    )

    return statement


@router.post("/leads/vehicle-inquiry", response_model=VehicleFunnelLeadOut, status_code=status.HTTP_201_CREATED)
def submit_vehicle_funnel_inquiry(
    payload: VehicleFunnelLeadCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Automotive Multi-Monetization Funnel Endpoint:
    1. Pre-qualifies customer against Mad Cars Dealership criteria (Income R10k+, Code B license, employed).
    2. Submits primary lead to Mad Cars Dealership (R200 CPL / R2,500 CPS).
    3. Automatically fans out to opted-in ancillary offers:
       - Car Insurance White Label (R70 CPL)
       - Vehicle Tracker White Label (R50 CPL)
       - Cartrack Dashcams (R55 CPL)
       - Motor Warranty White Label (R50 CPL)
    4. Calculates total potential qualified commission across the chain (up to R475+).
    5. Tags merchant owner attribution and emits continuity events.
    """
    from decimal import Decimal
    from src.services.continuity_event_service import emit_continuity_event

    merchant_id = current_user.get("uid") or current_user.get("sub")
    if not merchant_id:
        raise HTTPException(status_code=401, detail="Merchant identity required")

    # 1. Resolve Primary Offer: Mad Cars Dealership
    mad_cars = db.query(AffiliateOffer).filter(
        AffiliateOffer.slug == "mad-cars-dealership",
        AffiliateOffer.is_active == True
    ).first()

    if not mad_cars:
        raise HTTPException(status_code=500, detail="Mad Cars Dealership offer configuration missing")

    # Name splitting
    parts = payload.full_name.strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else "Buyer"

    # Primary Lead Creation
    primary_lead_payload = AffiliateLeadCreate(
        offer_id=mad_cars.id,
        first_name=first_name,
        last_name=last_name,
        phone_number=payload.phone_number,
        national_id=payload.national_id,
        email=payload.email,
        monthly_income=payload.monthly_income,
        is_employed=payload.is_employed,
        has_bank_account=payload.has_bank_account,
        is_sa_citizen=payload.is_sa_citizen,
        has_driver_license=payload.has_valid_license,
        age=payload.age,
        customer_metadata={
            "preferred_vehicle_type": payload.preferred_vehicle_type,
            "target_budget_range": payload.target_budget_range,
            "opt_in_insurance_quote": payload.opt_in_insurance_quote,
            "opt_in_tracker": payload.opt_in_tracker,
            "opt_in_dashcam": payload.opt_in_dashcam,
            "opt_in_warranty": payload.opt_in_warranty,
        }
    )

    primary_lead = submit_affiliate_lead(
        db=db,
        merchant_id=str(merchant_id),
        payload=primary_lead_payload
    )

    ancillary_leads = []
    total_potential = Decimal(str(mad_cars.base_payout))  # R200.00
    merchant_share = total_potential * Decimal(str(mad_cars.merchant_split_ratio or 0.70))

    # Helper for ancillary fanout
    def fanout_ancillary(slug: str):
        nonlocal total_potential, merchant_share
        offer = db.query(AffiliateOffer).filter(
            AffiliateOffer.slug == slug,
            AffiliateOffer.is_active == True
        ).first()
        if not offer:
            return

        anc_payload = AffiliateLeadCreate(
            offer_id=offer.id,
            first_name=first_name,
            last_name=last_name,
            phone_number=payload.phone_number,
            national_id=payload.national_id,
            email=payload.email,
            monthly_income=payload.monthly_income,
            is_employed=payload.is_employed,
            has_bank_account=payload.has_bank_account,
            is_sa_citizen=payload.is_sa_citizen,
            has_driver_license=payload.has_valid_license,
            age=payload.age,
            customer_metadata={
                "parent_vehicle_lead_id": str(primary_lead.id),
                "dealership": "Mad Cars Dealership",
                "vehicle_type": payload.preferred_vehicle_type
            }
        )
        try:
            anc_lead = submit_affiliate_lead(db=db, merchant_id=str(merchant_id), payload=anc_payload)
            ancillary_leads.append(anc_lead)
            total_potential += Decimal(str(offer.base_payout))
            merchant_share += Decimal(str(offer.base_payout)) * Decimal(str(offer.merchant_split_ratio or 0.70))
        except Exception:
            # If ancillary deduplication or soft disqualification occurs, don't abort primary dealership inquiry
            pass

    # 2. Automated Fanout to Selected Ancillaries
    if payload.opt_in_insurance_quote:
        fanout_ancillary("car-insurance-white-label")  # R70 CPL

    if payload.opt_in_tracker:
        fanout_ancillary("vehicle-tracker-white-label")  # R50 CPL

    if payload.opt_in_dashcam:
        fanout_ancillary("cartrack-dashcams")  # R55 CPL

    if payload.opt_in_warranty:
        fanout_ancillary("motor-warranty-white-label")  # R50 CPL

    # Log unified automotive dossier event
    emit_continuity_event(
        db=db,
        business_owner_id=str(merchant_id),
        business_category_key="automotive_finance",
        business_line="auxiliary_revenue",
        event_type="vehicle_funnel_dossier_dispatched",
        actor_type="merchant",
        actor_id=str(merchant_id),
        related_entity_type="affiliate_lead",
        related_entity_id=str(primary_lead.id),
        title=f"Mad Cars Dealership Inquiry Dispatched ({payload.preferred_vehicle_type})",
        description=f"Buyer dossier submitted to Mad Cars with {len(ancillary_leads)} ancillary cross-sells",
        payload={
            "primary_lead_id": str(primary_lead.id),
            "ancillary_count": len(ancillary_leads),
            "total_potential_commission": float(total_potential),
            "merchant_potential_share": float(merchant_share),
            "budget": payload.target_budget_range
        },
        auto_commit=True
    )

    return VehicleFunnelLeadOut(
        primary_lead=primary_lead,
        ancillary_leads=ancillary_leads,
        total_potential_commission=total_potential.quantize(Decimal("0.01")),
        merchant_potential_share=merchant_share.quantize(Decimal("0.01")),
        dispatch_status="DISPATCHED_TO_DEALERSHIP",
        message=f"Vehicle application successfully submitted to Mad Cars Dealership with {len(ancillary_leads)} ancillary protection quotes."
    )
