from sqlalchemy import Column, String, DateTime, Float
from src.database import Base
import uuid
from datetime import datetime

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referrer_profile_id = Column(String, nullable=False, index=True)
    referred_profile_id = Column(String, nullable=False, index=True)
    referral_code = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, qualified, paid, rejected
    reason = Column(String, nullable=True)  # cap_reached, self_referral, duplicate, admin_rejected
    reward_amount = Column(Float, default=10.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    qualified_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
