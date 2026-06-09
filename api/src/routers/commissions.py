from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.continuity_event_model import ContinuityEvent

router = APIRouter(prefix="/api/v1/commissions", tags=["commissions"])


@router.get("/business/{business_owner_id}/ledger")
def get_commission_ledger(business_owner_id: str, db: Session = Depends(get_db)):
    RELEVANT_EVENTS = [
        "lead_quote_request_captured",
        "quote_created",
        "application_submitted",
        "commission_expected",
        "commission_approved",
        "commission_paid",
        "commission_clawed_back",
    ]

    events = db.query(ContinuityEvent).filter(
        ContinuityEvent.business_owner_id == business_owner_id,
        ContinuityEvent.event_type.in_(RELEVANT_EVENTS)
    ).all()

    active_leads = 0
    quotes_drafted = 0
    applications_pending = 0
    expected_commission = 0.0
    commission_approved = 0.0
    commission_paid = 0.0
    commission_clawed_back = 0.0

    for event in events:
        t = event.event_type
        payload = getattr(event, "payload", None) or getattr(event, "payload_json", {}) or {}

        amount = 0.0
        try:
            amt_str = payload.get("amount", 0)
            if amt_str:
                amount = float(amt_str)
        except (ValueError, TypeError):
            pass

        if t == "lead_quote_request_captured":
            active_leads += 1
        elif t == "quote_created":
            quotes_drafted += 1
        elif t == "application_submitted":
            applications_pending += 1
        elif t == "commission_expected":
            expected_commission += amount
        elif t == "commission_approved":
            commission_approved += amount
        elif t == "commission_paid":
            commission_paid += amount
        elif t == "commission_clawed_back":
            commission_clawed_back += amount

    available_cash = commission_paid - commission_clawed_back

    def format_zar(val: float) -> str:
        return f"ZAR {val:,.2f}"

    return {
        "pipeline": {
            "activeLeads": active_leads,
            "quotesDrafted": quotes_drafted,
            "applicationsPending": applications_pending,
            "expectedCommission": format_zar(expected_commission),
        },
        "cashReality": {
            "commissionApproved": format_zar(commission_approved),
            "commissionPaid": format_zar(commission_paid),
            "commissionClawedBack": format_zar(commission_clawed_back),
            "availableCash": format_zar(available_cash),
        },
        "truthBoundary": "Pipeline value is not cash. Cash reality is reconstructed only from paid and clawed-back commission evidence."
    }
