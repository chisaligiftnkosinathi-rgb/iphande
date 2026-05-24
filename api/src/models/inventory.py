import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class InventoryMovementType(str, enum.Enum):
    stock_added = "stock_added"
    stock_reserved = "stock_reserved"
    stock_allocated = "stock_allocated"
    stock_consumed = "stock_consumed"
    stock_adjusted = "stock_adjusted"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    business_owner_id = Column(String, nullable=False, index=True)
    sku = Column(String, nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False, default="unit")
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False, index=True)
    movement_type = Column(Enum(InventoryMovementType), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    previous_balance = Column(Numeric(12, 2), nullable=False)
    next_balance = Column(Numeric(12, 2), nullable=False)
    reference_type = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    approved_by = Column(String, nullable=False)
    continuity_event_id = Column(UUID(as_uuid=True), nullable=False)
    balance_continuity_event_id = Column(UUID(as_uuid=True), nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
