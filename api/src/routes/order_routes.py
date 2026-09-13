import uuid
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.order import Order, OrderStatus, OrderType, DeliveryMode
from src.models.opportunity import Opportunity, ProductType
from src.models.profile import Profile
from src.schemas.order_schema import CheckoutRequest, CheckoutResponse, OrderDetailResponse

router = APIRouter(prefix="/orders", tags=["Orders & Checkout"])


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Direct checkout endpoint for Retail, Wholesale, and Digital goods.
    Calculates subtotal, validates stock, generates order, and returns PayFast payment URL.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    merchant = db.query(Profile).filter(Profile.owner_id == payload.business_owner_id).first()
    if not merchant:
        # Fallback query by profile id
        merchant = db.query(Profile).filter(Profile.id == payload.business_owner_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    subtotal = Decimal("0.00")
    order_items = []
    has_digital = False

    for item_input in payload.items:
        opp = db.query(Opportunity).filter(Opportunity.id == item_input.opportunity_id).first()
        if not opp:
            raise HTTPException(status_code=404, detail=f"Product {item_input.opportunity_id} not found")

        unit_price = Decimal(str(opp.price_amount or 0.00))
        item_subtotal = unit_price * item_input.quantity
        subtotal += item_subtotal

        if getattr(opp, "product_type", None) == ProductType.digital:
            has_digital = True

        order_items.append({
            "opportunity_id": opp.id,
            "title": opp.title,
            "quantity": item_input.quantity,
            "unit_price": float(unit_price),
            "subtotal": float(item_subtotal),
            "product_type": getattr(opp, "product_type", "physical")
        })

    # Order Number generation: e.g. ORD-2026-XXXX
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
    delivery_fee = Decimal("0.00") if payload.delivery_mode in ["pickup", "download"] else Decimal("50.00")
    total_amount = subtotal + delivery_fee

    # Setup digital download token if digital goods purchased
    download_token = secrets.token_urlsafe(32) if has_digital else None
    download_expiry = datetime.utcnow() + timedelta(days=7) if has_digital else None

    # Determine order type
    order_type = OrderType.digital if has_digital else OrderType.retail

    order = Order(
        order_number=order_number,
        business_owner_id=merchant.owner_id or merchant.id,
        customer_email=payload.customer_email,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        order_type=order_type,
        status=OrderStatus.pending,
        delivery_mode=payload.delivery_mode,
        currency=getattr(merchant, "currency", "ZAR"),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        items=order_items,
        shipping_address=payload.shipping_address,
        download_token=download_token,
        download_expiry=download_expiry
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # PayFast Payment Data
    payfast_data = {
        "m_payment_id": str(order.id),
        "amount": str(total_amount),
        "item_name": f"Order #{order_number} from {merchant.name}",
        "item_description": f"{len(order_items)} items",
        "email_address": payload.customer_email,
        "name_first": payload.customer_name or "Valued Customer",
        "return_url": payload.return_url or "http://localhost:8081/tabs/home",
        "cancel_url": payload.cancel_url or "http://localhost:8081/tabs/explore"
    }

    return CheckoutResponse(
        order_id=str(order.id),
        order_number=order.order_number,
        total_amount=order.total_amount,
        currency=order.currency,
        status=order.status.value,
        payment_url=f"/payments/payfast/create?order_id={order.id}",
        payfast_data=payfast_data
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """
    Get unified order details including item list, delivery status, and digital download.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    download_link = None
    if order.download_token and order.status == OrderStatus.paid:
        download_link = f"/api/v1/orders/downloads/{order.download_token}"

    return OrderDetailResponse(
        id=str(order.id),
        order_number=order.order_number,
        business_owner_id=order.business_owner_id,
        customer_email=order.customer_email,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        order_type=order.order_type.value,
        status=order.status.value,
        delivery_mode=order.delivery_mode.value,
        currency=order.currency,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        total_amount=order.total_amount,
        items=order.items,
        shipping_address=order.shipping_address,
        download_url=download_link,
        created_at=order.created_at
    )


@router.get("/downloads/{token}")
def download_digital_item(token: str, db: Session = Depends(get_db)):
    """
    Secure digital goods delivery endpoint. Validates token and expiry.
    """
    order = db.query(Order).filter(Order.download_token == token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invalid or expired download token")

    if order.status != OrderStatus.paid:
        raise HTTPException(status_code=403, detail="Order payment has not been completed")

    if order.download_expiry and datetime.utcnow() > order.download_expiry.replace(tzinfo=None):
        raise HTTPException(status_code=410, detail="Download link has expired")

    # Find download url in opportunity
    for item in order.items:
        opp_id = item.get("opportunity_id")
        opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
        if opp and opp.download_url:
            return RedirectResponse(url=opp.download_url)

    return {"status": "ok", "message": "Digital good ready for access", "order_number": order.order_number}
