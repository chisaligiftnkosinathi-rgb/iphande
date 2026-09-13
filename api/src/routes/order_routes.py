import uuid
import secrets
import hmac
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from src.database import get_db
from src.models.order import Order, OrderStatus, OrderType, DeliveryMode
from src.models.opportunity import Opportunity, ProductType
from src.models.profile import Profile
from src.schemas.order_schema import CheckoutRequest, CheckoutResponse, OrderDetailResponse
from src.constants.pudo_lockers import get_lockers
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter(prefix="/orders", tags=["Orders & Checkout"])


# ----------------------------------------------------------------------------
# 1. DIRECT CHECKOUT (Supports PayFast, PayJustNow, Paystack + Courier/Pudo)
# ----------------------------------------------------------------------------
@router.post("/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Unified checkout endpoint for Retail, Wholesale, and Digital goods.
    Integrates Courier Guy, Pudo smart lockers, and multi-gateway checkout:
    PayFast (Cards/Instant EFT), PayJustNow (3x BNPL), or Paystack.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    merchant = db.query(Profile).filter(Profile.owner_id == payload.business_owner_id).first()
    if not merchant:
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

        # Check stock quantity if physical retail
        if getattr(opp, "stock_quantity", None) is not None:
            if opp.stock_quantity < item_input.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{opp.title}'. Available: {opp.stock_quantity}"
                )

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

    # Shipping Calculation
    shipping_fee = Decimal("0.00")
    shipping_provider = payload.shipping_provider or ("pickup" if payload.delivery_mode == "pickup" else "courier_guy")
    
    if payload.delivery_mode == "shipping":
        if shipping_provider == "pudo":
            shipping_fee = Decimal("60.00")  # Standard Pudo Locker Locker rate
        elif shipping_provider == "courier_guy":
            shipping_fee = Decimal("85.00")  # Standard Courier Guy door-to-door rate
        else:
            shipping_fee = Decimal("70.00")
    elif payload.delivery_mode in ["pickup", "download"]:
        shipping_fee = Decimal("0.00")

    total_amount = subtotal + shipping_fee

    # Setup digital download token if digital goods purchased
    download_token = secrets.token_urlsafe(32) if has_digital else None
    download_expiry = datetime.utcnow() + timedelta(days=7) if has_digital else None
    order_type = OrderType.digital if has_digital else OrderType.retail
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"

    # Pre-generate Waybill / Locker Reservation
    shipping_tracking_id = None
    shipping_metadata = None
    if shipping_provider == "courier_guy":
        shipping_tracking_id = f"TCG-{secrets.token_hex(4).upper()}"
        shipping_metadata = {
            "carrier": "The Courier Guy",
            "service": "Standard Door-to-Door",
            "tracking_url": f"https://portal.thecourierguy.co.za/track?tracking_reference={shipping_tracking_id}"
        }
    elif shipping_provider == "pudo":
        shipping_tracking_id = f"PUDO-{secrets.token_hex(4).upper()}"
        locker_id = (payload.shipping_address or {}).get("locker_id", "pudo-jhb-soweto-jabulani")
        shipping_metadata = {
            "carrier": "Pudo Smart Lockers",
            "locker_id": locker_id,
            "pickup_pin": secrets.token_hex(2).upper(),
            "tracking_url": f"https://www.pudo.co.za/tracking?pin={shipping_tracking_id}"
        }

    # Installment Breakdown for PayJustNow (3 equal installments)
    installment_breakdown = None
    if payload.payment_provider == "payjustnow":
        part = round(total_amount / Decimal("3.0"), 2)
        remainder = total_amount - (part * 2)
        installment_breakdown = [
            {"installment": 1, "amount": float(part), "due_date": "Today", "status": "pending"},
            {"installment": 2, "amount": float(part), "due_date": (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"), "status": "scheduled"},
            {"installment": 3, "amount": float(remainder), "due_date": (datetime.utcnow() + timedelta(days=60)).strftime("%Y-%m-%d"), "status": "scheduled"}
        ]

    order = Order(
        order_number=order_number,
        business_owner_id=merchant.owner_id or merchant.id,
        customer_email=payload.customer_email,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        order_type=order_type,
        status=OrderStatus.pending,
        delivery_mode=payload.delivery_mode,
        shipping_provider=shipping_provider,
        shipping_tracking_id=shipping_tracking_id,
        shipping_metadata=shipping_metadata,
        payment_provider=payload.payment_provider,
        installment_breakdown=installment_breakdown,
        currency=getattr(merchant, "currency", "ZAR"),
        subtotal=subtotal,
        delivery_fee=shipping_fee,
        total_amount=total_amount,
        items=order_items,
        shipping_address=payload.shipping_address,
        download_token=download_token,
        download_expiry=download_expiry
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Multi-Gateway Gateway Dispatch URLs
    payment_url = f"/payments/payfast/create?order_id={order.id}"
    payfast_data = None

    if payload.payment_provider == "payfast":
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
    elif payload.payment_provider == "payjustnow":
        payment_url = f"https://secure.payjustnow.com/checkout?reference={order.order_number}&amount={total_amount}"
    elif payload.payment_provider == "paystack":
        payment_url = f"https://checkout.paystack.com/pay/{order.order_number}"

    return CheckoutResponse(
        order_id=str(order.id),
        order_number=order.order_number,
        total_amount=order.total_amount,
        currency=order.currency,
        status=order.status.value,
        payment_provider=order.payment_provider,
        payment_url=payment_url,
        payfast_data=payfast_data,
        installment_breakdown=order.installment_breakdown,
        shipping_provider=order.shipping_provider,
        shipping_tracking_id=order.shipping_tracking_id
    )


# ----------------------------------------------------------------------------
# 2. LOGISTICS: PUDO LOCKER DIRECTORY
# ----------------------------------------------------------------------------
@router.get("/pudo/lockers", response_model=List[Dict[str, Any]], tags=["Logistics"])
def list_pudo_lockers(city: Optional[str] = Query(None, description="Filter by city or suburb e.g. Soweto, Durban")):
    """
    Returns verified Pudo Smart Locker drop-off & pickup points across South Africa.
    """
    return get_lockers(city)


# ----------------------------------------------------------------------------
# 3. UNIFIED ORDER TRACKING (Courier Guy & Pudo)
# ----------------------------------------------------------------------------
@router.get("/{order_id}/tracking")
def get_order_tracking(order_id: str, db: Session = Depends(get_db)):
    """
    Returns real-time carrier tracking link, locker codes, and status.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    tracking_url = None
    if order.shipping_metadata and isinstance(order.shipping_metadata, dict):
        tracking_url = order.shipping_metadata.get("tracking_url")

    return {
        "order_number": order.order_number,
        "status": order.status.value,
        "shipping_provider": order.shipping_provider or "pickup",
        "shipping_tracking_id": order.shipping_tracking_id,
        "tracking_url": tracking_url,
        "shipping_metadata": order.shipping_metadata,
        "shipping_address": order.shipping_address
    }


# ----------------------------------------------------------------------------
# 4. PAYMENT WEBHOOKS (PayFast, Paystack, PayJustNow)
# ----------------------------------------------------------------------------
def _fulfill_order(order: Order, db: Session, provider: str, reference: str):
    """Marks order paid, decrements inventory stock, and emits audit event"""
    if order.status == OrderStatus.paid:
        return  # Idempotent

    order.status = OrderStatus.paid
    order.payment_reference = reference
    order.payment_provider = provider

    # Decrement physical stock
    for item in order.items:
        opp_id = item.get("opportunity_id")
        qty = item.get("quantity", 1)
        opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
        if opp and getattr(opp, "stock_quantity", None) is not None:
            opp.stock_quantity = max(Decimal("0.0"), opp.stock_quantity - Decimal(str(qty)))

    db.commit()

    emit_continuity_event(
        db,
        business_owner_id=order.business_owner_id,
        business_category_key=None,
        business_line=None,
        event_type="order_payment_completed",
        actor_type="payment_gateway",
        actor_id=provider,
        related_entity_type="order",
        related_entity_id=str(order.id),
        parent_event_id=None,
        payload={"order_number": order.order_number, "total_amount": float(order.total_amount), "provider": provider, "reference": reference},
        auto_commit=True
    )


@router.post("/payfast/webhook")
async def payfast_order_webhook(request: Request, db: Session = Depends(get_db)):
    """PayFast ITN callback for retail and digital e-commerce orders"""
    form_data = await request.form()
    data = {k: str(v) for k, v in form_data.items()}

    order_id = data.get("m_payment_id")
    pf_payment_id = data.get("pf_payment_id")
    payment_status = data.get("payment_status", "").upper()

    if not order_id or payment_status != "COMPLETE":
        return {"status": "ignored"}

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"status": "order_not_found"}

    _fulfill_order(order, db, "payfast", pf_payment_id or "payfast-verified")
    return {"status": "success", "order_id": str(order.id)}


@router.post("/paystack/webhook")
async def paystack_order_webhook(request: Request, db: Session = Depends(get_db)):
    """Paystack transaction webhook handler"""
    payload = await request.json()
    event = payload.get("event")
    data = payload.get("data", {})

    if event == "charge.success":
        ref = data.get("reference")
        # Find order by order_number or payment_reference
        order = db.query(Order).filter((Order.order_number == ref) | (Order.payment_reference == ref)).first()
        if order:
            _fulfill_order(order, db, "paystack", ref)

    return {"status": "success"}


@router.post("/payjustnow/webhook")
async def payjustnow_order_webhook(request: Request, db: Session = Depends(get_db)):
    """PayJustNow 3x installment authorization callback"""
    payload = await request.json()
    merchant_reference = payload.get("merchant_reference")
    pjn_transaction_id = payload.get("transaction_id")
    status = payload.get("status", "").upper()

    if status in ["APPROVED", "CAPTURED", "SUCCESS"]:
        order = db.query(Order).filter(Order.order_number == merchant_reference).first()
        if order:
            _fulfill_order(order, db, "payjustnow", pjn_transaction_id or "pjn-authorized")

    return {"status": "success"}


# ----------------------------------------------------------------------------
# 5. ORDER DETAILS & SECURE DIGITAL DOWNLOADS
# ----------------------------------------------------------------------------
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
        shipping_provider=order.shipping_provider,
        shipping_tracking_id=order.shipping_tracking_id,
        shipping_metadata=order.shipping_metadata,
        payment_provider=order.payment_provider,
        payment_reference=order.payment_reference,
        installment_breakdown=order.installment_breakdown,
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

    for item in order.items:
        opp_id = item.get("opportunity_id")
        opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
        if opp and opp.download_url:
            return RedirectResponse(url=opp.download_url)

    return {"status": "ok", "message": "Digital good ready for access", "order_number": order.order_number}
