from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from src.models.financial_event import AccountingCategory, CashDirection, FinancialEventType


class FinancialEventCreate(BaseModel):
    business_owner_id: str
    event_type: FinancialEventType
    amount: Decimal = Field(gt=0)
    currency: str = "ZAR"
    description: str
    occurred_at: datetime
    accounting_category: AccountingCategory
    cash_direction: CashDirection = CashDirection.none
    source_actor: str | None = None
    counterparty: str | None = None
    creates_obligation: bool = False


class FinancialEventOut(BaseModel):
    id: UUID
    business_owner_id: str
    event_type: FinancialEventType
    amount: Decimal
    currency: str
    description: str
    occurred_at: datetime
    accounting_category: AccountingCategory
    cash_direction: CashDirection
    source_actor: str | None = None
    counterparty: str | None = None
    creates_obligation: bool
    continuity_event_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CashReplayOut(BaseModel):
    business_owner_id: str
    currency: str
    inflow_total: Decimal
    outflow_total: Decimal
    net_cash: Decimal
    events: list[FinancialEventOut]


class ProfitSnapshotOut(BaseModel):
    business_owner_id: str
    currency: str
    income_total: Decimal
    expense_total: Decimal
    profit: Decimal


class ObligationViewOut(BaseModel):
    business_owner_id: str
    currency: str
    obligation_total: Decimal
    obligations: list[FinancialEventOut]
