import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Float, Numeric, Integer, Enum
from sqlalchemy.dialects.sqlite import TEXT
from src.database import Base
import uuid
from datetime import datetime
from src.models.order import DeliveryMode

class ProductType(str, enum.Enum):
    physical = "physical"
    service = "service"
    digital = "digital"

class PriceModel(str, enum.Enum):
    fixed = "fixed"
    tiered = "tiered"
    subscription = "subscription"
    quote_required = "quote_required"

class Opportunity(Base):
    __tablename__ = "opportunities"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by_profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)

    # E-Commerce Core Fields
    product_type = Column(Enum(ProductType, name="producttype"), default=ProductType.service, nullable=False)
    price_model = Column(Enum(PriceModel, name="pricemodel"), default=PriceModel.quote_required, nullable=False)
    price_amount = Column(Numeric(12, 2), nullable=True)
    delivery_mode = Column(Enum(DeliveryMode, name="deliverymode"), default=DeliveryMode.onsite, nullable=False)
    sku = Column(String, nullable=True, index=True)
    stock_quantity = Column(Numeric(12, 2), nullable=True)
    min_order_quantity = Column(Integer, default=1, nullable=False)
    download_url = Column(String, nullable=True)
    service_duration_mins = Column(Integer, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open") # open, contacted, closed

    province = Column(String, nullable=True)
    town_or_city = Column(String, nullable=True)
    suburb_or_area = Column(String, nullable=True)
    place_code = Column(String, nullable=True, index=True)

    latitude = Column('latitude', Float, nullable=True)
    longitude = Column('longitude', Float, nullable=True)

    category_key = Column(String, nullable=True)
    service_needed = Column(String, nullable=True)
    budget_amount = Column(String, nullable=True)

    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

    image_url_1 = Column(String, nullable=True)
    image_url_2 = Column(String, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
