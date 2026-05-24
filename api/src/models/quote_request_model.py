from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base
import enum
import uuid

class QuoteRequestStatus(str, enum.Enum):
    quote_requested = "quote_requested"
    quote_reviewed = "quote_reviewed"
    quote_contacted = "quote_contacted"
    quote_converted = "quote_converted"
    quote_closed = "quote_closed"
    new = "new"
    contacted = "contacted"
    quoted = "quoted"
    accepted = "accepted"
    declined = "declined"
    closed = "closed"
    application_submitted = "application_submitted"
    evidence_review_pending = "evidence_review_pending"
    sale_confirmed = "sale_confirmed"

class QuoteRequest(Base):
    __tablename__ = "quote_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_owner_id = Column(String, nullable=False)
    business_category_key = Column(String, nullable=False)
    business_line = Column(String, nullable=False)
    post_id = Column(String, nullable=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_location = Column(String, nullable=True)
    service_needed = Column(String, nullable=True)
    preferred_date = Column(String, nullable=True)
    message = Column(String, nullable=True)
    status = Column(Enum(QuoteRequestStatus), default=QuoteRequestStatus.quote_requested, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
