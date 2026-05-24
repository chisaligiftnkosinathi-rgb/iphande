from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from src.models.inventory import InventoryMovementType


class InventoryItemCreate(BaseModel):
    business_owner_id: str
    sku: str
    name: str
    unit: str = "unit"


class InventoryItemOut(BaseModel):
    id: UUID
    business_owner_id: str
    sku: str
    name: str
    unit: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class InventoryMovementCreate(BaseModel):
    quantity: Decimal = Field(gt=0)
    reference_type: str | None = None
    reference_id: str | None = None
    notes: str | None = None
    approved_by: str
    occurred_at: datetime | None = None


class InventoryMovementOut(BaseModel):
    id: UUID
    inventory_item_id: UUID
    movement_type: InventoryMovementType
    quantity: Decimal
    previous_balance: Decimal
    next_balance: Decimal
    reference_type: str | None = None
    reference_id: str | None = None
    notes: str | None = None
    approved_by: str
    continuity_event_id: UUID
    balance_continuity_event_id: UUID
    occurred_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InventoryBalanceOut(BaseModel):
    inventory_item_id: UUID
    business_owner_id: str
    sku: str
    name: str
    unit: str
    balance: Decimal
    active: bool
