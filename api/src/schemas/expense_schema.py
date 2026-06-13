from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    business_owner_id: str
    amount: Decimal = Field(..., gt=0, description="Amount must be positive")
    category: str
    description: Optional[str] = None
    date: date
    receipt_photo_url: Optional[str] = None


class ExpenseOut(BaseModel):
    id: UUID
    business_owner_id: str
    amount: Decimal
    category: str
    description: Optional[str]
    date: date
    receipt_photo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ExpenseSummaryOut(BaseModel):
    income: Decimal
    expenses: Decimal
    net_position: Decimal
