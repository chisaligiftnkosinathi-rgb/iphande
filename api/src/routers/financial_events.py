import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.financial_event import (
    AccountingCategory,
    CashDirection,
    FinancialEvent,
)
from src.schemas.financial_event_schema import (
    CashReplayOut,
    FinancialEventCreate,
    FinancialEventOut,
    ObligationViewOut,
    ProfitSnapshotOut,
)
from src.services.continuity_event_service import emit_continuity_event


router = APIRouter(prefix="/api/v1/financial-events", tags=["financial-events"])


@router.post("", response_model=FinancialEventOut)
def create_financial_event(payload: FinancialEventCreate, db: Session = Depends(get_db)):
    financial_event_id = uuid.uuid4()
    with replay_transaction(db):
        continuity_event = emit_continuity_event(
            db,
            business_owner_id=payload.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type=payload.event_type.value,
            actor_type=payload.source_actor or "business_owner",
            actor_id=payload.business_owner_id,
            related_entity_type="financial_event",
            related_entity_id=str(financial_event_id),
            payload={
                "amount": str(payload.amount),
                "currency": payload.currency,
                "description": payload.description,
                "accounting_category": payload.accounting_category.value,
                "cash_direction": payload.cash_direction.value,
                "counterparty": payload.counterparty,
                "creates_obligation": payload.creates_obligation,
            },
            auto_commit=False,
        )
        financial_event = FinancialEvent(
            id=financial_event_id,
            business_owner_id=payload.business_owner_id,
            event_type=payload.event_type,
            amount=payload.amount,
            currency=payload.currency,
            description=payload.description,
            occurred_at=payload.occurred_at,
            accounting_category=payload.accounting_category,
            cash_direction=payload.cash_direction,
            source_actor=payload.source_actor,
            counterparty=payload.counterparty,
            creates_obligation=payload.creates_obligation,
            continuity_event_id=continuity_event.id,
        )
        db.add(financial_event)
        db.flush()
        db.refresh(financial_event)

    return financial_event


@router.get("/business/{business_owner_id}", response_model=list[FinancialEventOut])
def list_financial_events_for_business(business_owner_id: str, db: Session = Depends(get_db)):
    return _events_for_business(db, business_owner_id)


@router.get("/business/{business_owner_id}/cash-replay", response_model=CashReplayOut)
def get_cash_replay(business_owner_id: str, db: Session = Depends(get_db)):
    events = _events_for_business(db, business_owner_id)
    currency = _report_currency(events)
    inflow_total = sum((event.amount for event in events if event.cash_direction == CashDirection.inflow), Decimal("0"))
    outflow_total = sum((event.amount for event in events if event.cash_direction == CashDirection.outflow), Decimal("0"))
    return CashReplayOut(
        business_owner_id=business_owner_id,
        currency=currency,
        inflow_total=inflow_total,
        outflow_total=outflow_total,
        net_cash=inflow_total - outflow_total,
        events=events,
    )


@router.get("/business/{business_owner_id}/profit-snapshot", response_model=ProfitSnapshotOut)
def get_profit_snapshot(business_owner_id: str, db: Session = Depends(get_db)):
    events = _events_for_business(db, business_owner_id)
    currency = _report_currency(events)
    income_total = sum((event.amount for event in events if event.accounting_category == AccountingCategory.income), Decimal("0"))
    expense_total = sum((event.amount for event in events if event.accounting_category == AccountingCategory.expense), Decimal("0"))
    return ProfitSnapshotOut(
        business_owner_id=business_owner_id,
        currency=currency,
        income_total=income_total,
        expense_total=expense_total,
        profit=income_total - expense_total,
    )


@router.get("/business/{business_owner_id}/obligations", response_model=ObligationViewOut)
def get_obligations(business_owner_id: str, db: Session = Depends(get_db)):
    events = _events_for_business(db, business_owner_id)
    obligations = [
        event
        for event in events
        if event.creates_obligation or event.accounting_category == AccountingCategory.liability
    ]
    currency = _report_currency(events)
    obligation_total = sum((event.amount for event in obligations), Decimal("0"))
    return ObligationViewOut(
        business_owner_id=business_owner_id,
        currency=currency,
        obligation_total=obligation_total,
        obligations=obligations,
    )


def _events_for_business(db: Session, business_owner_id: str) -> list[FinancialEvent]:
    return (
        db.query(FinancialEvent)
        .filter(FinancialEvent.business_owner_id == business_owner_id)
        .order_by(FinancialEvent.occurred_at.asc(), FinancialEvent.created_at.asc())
        .all()
    )


def _report_currency(events: list[FinancialEvent]) -> str:
    if not events:
        return "ZAR"
    return events[0].currency
