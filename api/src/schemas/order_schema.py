from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime
from decimal import Decimal


class OrderItemInput(BaseModel):
    opportunity_id: str
    quantity: int = 1


class CheckoutRequest(BaseModel):
    business_owner_id: str
    customer_email: EmailStr
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_mode: str = "pickup"  # pickup, shipping, download, onsite
    shipping_address: Optional[dict] = None
    items: List[OrderItemInput]
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    order_id: str
    order_number: str
    total_amount: Decimal
    currency: str
    status: str
    payment_url: Optional[str] = None
    payfast_data: Optional[dict] = None


class OrderDetailResponse(BaseModel):
    id: str
    order_number: str
    business_owner_id: str
    customer_email: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    order_type: str
    status: str
    delivery_mode: str
    currency: str
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    items: List[Any]
    shipping_address: Optional[dict] = None
    download_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
