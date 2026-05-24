import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class QuoteStatus(str, enum.Enum):
    quote_drafted = "quote_drafted"
    quote_reviewed = "quote_reviewed"
    quote_sent = "quote_sent"
    quote_accepted = "quote_accepted"
    quote_declined = "quote_declined"
    quote_expired = "quote_expired"
    quote_converted = "quote_converted"
    issued = "issued"
    accepted = "accepted"
    declined = "declined"


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    business_owner_id = Column(String, nullable=False, index=True)
    customer_request_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    description = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, default="ZAR")
    terms = Column(String, nullable=True)
    status = Column(Enum(QuoteStatus), nullable=False, default=QuoteStatus.issued)
    continuity_event_id = Column(UUID(as_uuid=True), nullable=False)
    accepted_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
