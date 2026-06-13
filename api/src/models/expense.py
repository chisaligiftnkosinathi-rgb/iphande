from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from src.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_owner_id = Column(String, index=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    receipt_photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
