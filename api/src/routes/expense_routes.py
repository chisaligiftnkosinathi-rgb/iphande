from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.database import get_db, replay_transaction
from src.auth.supabase_auth import get_current_user
from src.models.expense import Expense
from src.models.quote import Quote, QuoteStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.schemas.expense_schema import ExpenseCreate, ExpenseOut, ExpenseSummaryOut
from src.services.continuity_event_service import emit_continuity_event
from src.replay.constants import ContinuityEventType, ActorType, EntityType
from src.data.expense_categories import get_expense_categories_for_archetype

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])

@router.get("/categories")
def get_categories(archetype_key: str | None = Query(None)):
    return {"categories": get_expense_categories_for_archetype(archetype_key)}


@router.post("", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from src.services.verification_service import verify_tenant_access
    profile = verify_tenant_access(db, current_user, payload.business_owner_id)
    
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be positive")

    expense = Expense(
        business_owner_id=profile.id,
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        date=payload.date,
        receipt_photo_url=payload.receipt_photo_url,
    )

    with replay_transaction(db):
        db.add(expense)
        db.flush()
        db.refresh(expense)

        emit_continuity_event(
            db,
            business_owner_id=expense.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="expense_recorded",
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=expense.business_owner_id,
            related_entity_type="expense",
            related_entity_id=str(expense.id),
            payload={
                "amount": str(expense.amount),
                "category": expense.category,
                "date": expense.date.isoformat(),
                "description": expense.description,
            },
            auto_commit=False,
        )
    return expense


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    business_owner_id: str,
    month: int | None = Query(None, description="Month (1-12)"),
    year: int | None = Query(None, description="Year (e.g., 2026)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from src.services.verification_service import verify_tenant_access
    profile = verify_tenant_access(db, current_user, business_owner_id)
    
    query = db.query(Expense).filter(Expense.business_owner_id == profile.id)
    
    # In sqlite EXTRACT(MONTH) might not work natively but since this is postgres in prod it will
    # we can use date comparisons instead
    if month and year:
        # Construct start and end dates
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
            
        query = query.filter(Expense.date >= start_date, Expense.date < end_date)
        
    return query.order_by(Expense.date.desc()).all()


@router.get("/summary", response_model=ExpenseSummaryOut)
def get_expense_summary(
    business_owner_id: str,
    month: int | None = Query(None),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from src.services.verification_service import verify_tenant_access
    profile = verify_tenant_access(db, current_user, business_owner_id)

    # Calculate expenses
    expenses_query = db.query(func.sum(Expense.amount)).filter(Expense.business_owner_id == profile.id)
    
    if month and year:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        expenses_query = expenses_query.filter(Expense.date >= start_date, Expense.date < end_date)
        
    total_expenses = expenses_query.scalar() or Decimal("0.00")

    # Calculate income. For V1 we can use accepted quotes or fully paid payment intents.
    # Let's use Quote with status accepted for simplicity, or PaymentIntent with status paid.
    # We will use Quotes where status is accepted or completed, based on created_at or accepted_at
    # Actually, a better proxy for income is PaymentIntent with status = paid, but let's see.
    # Wait, the user specifically mentioned "Income: R15000, Expenses: R7000".
    # I'll use accepted Quotes amount as proxy for income if we don't have enough paid PaymentIntents.
    # Let's use Quotes with status accepted, completed.
    
    income_query = db.query(func.sum(Quote.amount)).filter(
        Quote.business_owner_id == profile.id,
        Quote.status.in_([QuoteStatus.accepted, "completed", "paid"])
    )
    
    if month and year:
        # Assuming accepted_at or created_at
        start_datetime = datetime(year, month, 1)
        if month == 12:
            end_datetime = datetime(year + 1, 1, 1)
        else:
            end_datetime = datetime(year, month + 1, 1)
            
        income_query = income_query.filter(Quote.created_at >= start_datetime, Quote.created_at < end_datetime)
        
    total_income = income_query.scalar() or Decimal("0.00")
    
    net_position = total_income - total_expenses
    
    return ExpenseSummaryOut(
        income=total_income,
        expenses=total_expenses,
        net_position=net_position
    )
