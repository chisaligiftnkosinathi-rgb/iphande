from sqlalchemy import Column, String, DateTime, Float, JSON
from datetime import datetime
from src.database import Base


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)

    amount = Column(Float, nullable=False)
    currency = Column(String, default="ZAR")

    status = Column(String, default="pending")  # pending | successful | failed

    provider = Column(String, default="manual")  # stripe/payfast/manual

    payload = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow)
