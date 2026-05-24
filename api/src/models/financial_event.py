import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class FinancialEventType(str, enum.Enum):
    income_received = "income_received"
    expense_paid = "expense_paid"
    debt_created = "debt_created"
    debt_paid = "debt_paid"
    stock_purchased = "stock_purchased"
    asset_acquired = "asset_acquired"
    customer_owed = "customer_owed"
    supplier_owed = "supplier_owed"
    owner_withdrawal = "owner_withdrawal"
    savings_set_aside = "savings_set_aside"


class AccountingCategory(str, enum.Enum):
    asset = "Asset"
    liability = "Liability"
    equity = "Equity"
    income = "Income"
    expense = "Expense"


class CashDirection(str, enum.Enum):
    inflow = "inflow"
    outflow = "outflow"
    none = "none"


class FinancialEvent(Base):
    __tablename__ = "financial_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    business_owner_id = Column(String, nullable=False, index=True)
    event_type = Column(Enum(FinancialEventType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, default="ZAR")
    description = Column(String, nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    accounting_category = Column(Enum(AccountingCategory), nullable=False)
    cash_direction = Column(Enum(CashDirection), nullable=False, default=CashDirection.none)
    source_actor = Column(String, nullable=True)
    counterparty = Column(String, nullable=True)
    creates_obligation = Column(Boolean, nullable=False, default=False)
    continuity_event_id = Column(UUID(as_uuid=True), ForeignKey("continuity_events.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
