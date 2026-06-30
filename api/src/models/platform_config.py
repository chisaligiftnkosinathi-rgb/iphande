import enum
import uuid

from sqlalchemy import Column, DateTime, Numeric, String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.sql import func

from src.database import Base


class ConfigScope(str, enum.Enum):
    """Scope level for fee configuration"""
    global_default = "global_default"
    trust_tier = "trust_tier"
    business_category = "business_category"
    promotional = "promotional"


class PlatformConfig(Base):
    """
    Platform fee configuration and business rules.

    System truth: Fee percentages and payout rules are configurable
    without code deployment.

    Design:
    - One global_default fee (fallback)
    - Tier-based overrides (trust level specific)
    - Category overrides (merchant category specific)
    - Promotional overrides (temporary campaigns)

    Priority: promotional > category > tier > global_default
    """
    __tablename__ = "platform_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Configuration Identity
    key = Column(String, nullable=False, index=True)  # e.g., "platform_fee_percent"
    scope = Column(String, nullable=False, default=ConfigScope.global_default, index=True)

    # Scope Qualifiers
    trust_tier = Column(String, nullable=True, index=True)  # e.g., "anonymous", "registered", "activated", "trusted"
    business_category = Column(String, nullable=True, index=True)  # e.g., "plumbing", "electrical", "cleaning"
    campaign_id = Column(String, nullable=True, index=True)  # e.g., "launch_promo_q3_2026"

    # Value Storage
    value_type = Column(String, nullable=False, default="decimal")  # decimal, integer, string, boolean, json
    decimal_value = Column(Numeric(5, 2), nullable=True)
    integer_value = Column(String, nullable=True)
    string_value = Column(String, nullable=True)
    boolean_value = Column(Boolean, nullable=True)
    json_value = Column(JSON, nullable=True)

    # Validity
    is_active = Column(Boolean, default=True, nullable=False)
    effective_from = Column(DateTime(timezone=True), nullable=True)
    effective_until = Column(DateTime(timezone=True), nullable=True)

    # Governance
    description = Column(Text, nullable=True)
    changed_by = Column(String, nullable=True)  # Admin user who set this
    change_reason = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class LedgerImmutabilityLog(Base):
    """
    Audit log of ledger record access and immutability enforcement.

    Purpose: Track and enforce read-only guarantees on ledger entries.
    Helps diagnose any accidental or malicious ledger modifications.
    """
    __tablename__ = "ledger_immutability_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # What was protected
    ledger_type = Column(String, nullable=False, index=True)  # "payment_intent", "fee_ledger", "earning_ledger"
    ledger_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Protection action
    action = Column(String, nullable=False)  # "creation_locked", "status_transition_allowed", "modification_blocked"

    # Context
    triggered_by = Column(String, nullable=True)  # User or system action
    attempted_change = Column(Text, nullable=True)  # What was attempted
    block_reason = Column(String, nullable=True)  # Why it was blocked

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
