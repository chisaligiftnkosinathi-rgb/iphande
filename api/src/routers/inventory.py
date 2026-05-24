from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.continuity_event_model import ContinuityEvent
from src.models.inventory import InventoryItem, InventoryMovement, InventoryMovementType
from src.schemas.inventory_schema import (
    InventoryBalanceOut,
    InventoryItemCreate,
    InventoryItemOut,
    InventoryMovementCreate,
    InventoryMovementOut,
)
from src.services.continuity_event_service import emit_continuity_event


router = APIRouter(prefix="/api/v1/inventory", tags=["inventory"])


@router.post("/items", response_model=InventoryItemOut)
def create_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.business_owner_id == payload.business_owner_id,
            InventoryItem.sku == payload.sku,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Inventory item SKU already exists for this business")

    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/items/{item_id}/add-stock", response_model=InventoryMovementOut)
def add_stock(item_id: UUID, payload: InventoryMovementCreate, db: Session = Depends(get_db)):
    return record_inventory_movement(
        db=db,
        item_id=item_id,
        payload=payload,
        movement_type=InventoryMovementType.stock_added,
    )


@router.post("/items/{item_id}/consume-stock", response_model=InventoryMovementOut)
def consume_stock(item_id: UUID, payload: InventoryMovementCreate, db: Session = Depends(get_db)):
    return record_inventory_movement(
        db=db,
        item_id=item_id,
        payload=payload,
        movement_type=InventoryMovementType.stock_consumed,
    )


@router.get("/business/{business_owner_id}/balances", response_model=list[InventoryBalanceOut])
def list_inventory_balances(business_owner_id: str, db: Session = Depends(get_db)):
    items = (
        db.query(InventoryItem)
        .filter(InventoryItem.business_owner_id == business_owner_id)
        .order_by(InventoryItem.name.asc())
        .all()
    )
    return [
        InventoryBalanceOut(
            inventory_item_id=item.id,
            business_owner_id=item.business_owner_id,
            sku=item.sku,
            name=item.name,
            unit=item.unit,
            balance=get_inventory_balance(db, item.id),
            active=item.active,
        )
        for item in items
    ]


@router.get("/items/{item_id}/replay", response_model=list[InventoryMovementOut])
def get_inventory_replay(item_id: UUID, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return (
        db.query(InventoryMovement)
        .filter(InventoryMovement.inventory_item_id == item_id)
        .order_by(InventoryMovement.occurred_at.asc(), InventoryMovement.created_at.asc())
        .all()
    )


def record_inventory_movement(
    *,
    db: Session,
    item_id: UUID,
    payload: InventoryMovementCreate,
    movement_type: InventoryMovementType,
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    previous_balance = get_inventory_balance(db, item_id)
    signed_quantity = movement_signed_quantity(movement_type, payload.quantity)
    next_balance = previous_balance + signed_quantity
    if next_balance < 0:
        raise HTTPException(status_code=409, detail="Inventory movement would create negative balance")

    occurred_at = payload.occurred_at or datetime.now(timezone.utc)
    movement = InventoryMovement(
        inventory_item_id=item.id,
        movement_type=movement_type,
        quantity=payload.quantity,
        previous_balance=previous_balance,
        next_balance=next_balance,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        notes=payload.notes,
        approved_by=payload.approved_by,
        occurred_at=occurred_at,
    )

    with replay_transaction(db):
        movement_event = emit_continuity_event(
            db,
            business_owner_id=item.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="inventory_movement_recorded",
            actor_type="business_owner",
            actor_id=payload.approved_by,
            related_entity_type="inventory_item",
            related_entity_id=str(item.id),
            payload={
                "inventory_item_id": str(item.id),
                "sku": item.sku,
                "name": item.name,
                "movement_type": movement_type.value,
                "previous_balance": str(previous_balance),
                "movement_quantity": str(payload.quantity),
                "next_balance": str(next_balance),
                "reference_type": payload.reference_type,
                "reference_id": payload.reference_id,
                "approved_by": payload.approved_by,
            },
            auto_commit=False,
        )
        balance_event = emit_continuity_event(
            db,
            business_owner_id=item.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="inventory_balance_changed",
            actor_type="business_owner",
            actor_id=payload.approved_by,
            related_entity_type="inventory_item",
            related_entity_id=str(item.id),
            parent_event_id=movement_event.id,
            payload={
                "inventory_item_id": str(item.id),
                "sku": item.sku,
                "name": item.name,
                "movement_type": movement_type.value,
                "previous_balance": str(previous_balance),
                "movement_quantity": str(payload.quantity),
                "next_balance": str(next_balance),
                "reference_type": payload.reference_type,
                "reference_id": payload.reference_id,
            },
            auto_commit=False,
        )
        movement.continuity_event_id = movement_event.id
        movement.balance_continuity_event_id = balance_event.id
        db.add(movement)
        db.flush()
        db.refresh(movement)

    return movement


def get_inventory_balance(db: Session, item_id: UUID) -> Decimal:
    movements = (
        db.query(InventoryMovement)
        .filter(InventoryMovement.inventory_item_id == item_id)
        .all()
    )
    balance = Decimal("0")
    for movement in movements:
        balance += movement_signed_quantity(movement.movement_type, movement.quantity)
    return balance


def movement_signed_quantity(
    movement_type: InventoryMovementType,
    quantity: Decimal,
) -> Decimal:
    if movement_type in {
        InventoryMovementType.stock_added,
        InventoryMovementType.stock_adjusted,
    }:
        return quantity
    return -quantity
