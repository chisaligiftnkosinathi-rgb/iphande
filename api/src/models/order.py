import enum
import uuid
from sqlalchemy import Column, String, DateTime, Numeric, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.database import Base


class OrderType(str, enum.Enum):
    retail = "retail"
    service = "service"
    wholesale = "wholesale"
    digital = "digital"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    processing = "processing"
    fulfilled = "fulfilled"
    cancelled = "cancelled"
    refunded = "refunded"


class DeliveryMode(str, enum.Enum):
    pickup = "pickup"
    shipping = "shipping"
    download = "download"
    onsite = "onsite"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    order_number = Column(String, unique=True, nullable=False, index=True)
    business_owner_id = Column(String, nullable=False, index=True)
    customer_id = Column(String, nullable=True, index=True)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)

    order_type = Column(Enum(OrderType, name="ordertype"), nullable=False, default=OrderType.retail)
    status = Column(Enum(OrderStatus, name="orderstatus"), nullable=False, default=OrderStatus.pending)
    delivery_mode = Column(Enum(DeliveryMode, name="deliverymode"), nullable=False, default=DeliveryMode.pickup)

    # Financials
    currency = Column(String, default="ZAR", nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.00)
    delivery_fee = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0.00)

    # Integration links
    payment_intent_id = Column(String, nullable=True, index=True)
    quote_id = Column(String, nullable=True, index=True)
    invoice_id = Column(String, nullable=True, index=True)

    # Line items & shipping details (JSON snapshot)
    items = Column(JSON, nullable=False, default=list)  # [{opportunity_id, title, quantity, unit_price, subtotal}]
    shipping_address = Column(JSON, nullable=True)

    # Shipping & Logistics
    shipping_provider = Column(String, nullable=True)  # 'courier_guy', 'pudo', 'pickup'
    shipping_tracking_id = Column(String, nullable=True, index=True)
    shipping_metadata = Column(JSON, nullable=True)  # Locker code, collection PIN, waybill details

    # Multi-Gateway Payments
    payment_provider = Column(String, default="payfast", nullable=False)  # 'payfast', 'payjustnow', 'paystack'
    payment_reference = Column(String, nullable=True, index=True)
    installment_breakdown = Column(JSON, nullable=True)  # PayJustNow 3x payment schedule

    # Digital fulfillment
    download_token = Column(String, nullable=True, unique=True)
    download_expiry = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
