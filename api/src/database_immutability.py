"""
SQLAlchemy Event Listeners for Ledger Immutability

Enforces database-level write protection on financial ledgers
after creation. This prevents accidental or malicious modifications
to critical financial fields.

Immutable fields (cannot be changed after creation):
- FeeLedger: payment_intent_id, total_amount, platform_fee_amount, provider_amount, currency
- TreasuryLedger: payment_intent_id, fee_ledger_id, amount, currency, entry_type, owner
- EarningLedger: user_id, merchant_account_id, payment_intent_id, amount, currency

Mutable fields (can be modified):
- status (state machine transitions only)
- settlement_reference, settlement_memo (for settlement tracking)
- reversed_at, settlement_at (for status transitions)
- Audit metadata (within allowed transitions)
"""

from sqlalchemy.orm import object_session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import History

from src.models.fee_ledger import FeeLedger
from src.models.treasury_ledger import TreasuryLedger
from src.models.earning_ledger import EarningLedger
from src.models.platform_config import LedgerImmutabilityLog


# ===== IMMUTABLE FIELD DEFINITIONS =====

IMMUTABLE_FEE_LEDGER_FIELDS = {
    "payment_intent_id",
    "total_amount",
    "platform_fee_percent",
    "platform_fee_amount",
    "provider_amount",
    "currency",
}

IMMUTABLE_TREASURY_LEDGER_FIELDS = {
    "payment_intent_id",
    "fee_ledger_id",
    "amount",
    "currency",
    "entry_type",
    "owner",
}

IMMUTABLE_EARNING_LEDGER_FIELDS = {
    "user_id",
    "merchant_account_id",
    "payment_intent_id",
    "amount",
    "currency",
}


# ===== EVENT LISTENERS =====

def protect_fee_ledger_immutability(mapper, connection, target):
    """
    Prevent modifications to FeeLedger after creation.

    This fires BEFORE INSERT/UPDATE/DELETE.
    """
    session = object_session(target)

    if session is None:
        return

    # Only check on UPDATE (not INSERT, not DELETE)
    if target in session.new:
        return  # New record, allow creation

    if target in session.deleted:
        return  # Deletion, allow it (via cascade if needed)

    # Check if any immutable fields were changed
    for field_name in IMMUTABLE_FEE_LEDGER_FIELDS:
        history = session.get_history(target, field_name)

        # history is (added, unchanged, deleted)
        # If both added and deleted are non-empty, field was changed
        if history.deleted and history.added:
            old_value = list(history.deleted)[0]
            new_value = list(history.added)[0]

            raise IntegrityError(
                f"Cannot modify immutable field {field_name} on FeeLedger {target.id}. "
                f"Old: {old_value}, New: {new_value}. "
                f"Once created, FeeLedger amounts are immutable for audit safety.",
                None,
                None
            )


def protect_treasury_ledger_immutability(mapper, connection, target):
    """
    Prevent modifications to TreasuryLedger after creation.
    """
    session = object_session(target)

    if session is None:
        return

    if target in session.new:
        return

    if target in session.deleted:
        return

    for field_name in IMMUTABLE_TREASURY_LEDGER_FIELDS:
        history = session.get_history(target, field_name)

        if history.deleted and history.added:
            old_value = list(history.deleted)[0]
            new_value = list(history.added)[0]

            raise IntegrityError(
                f"Cannot modify immutable field {field_name} on TreasuryLedger {target.id}. "
                f"Old: {old_value}, New: {new_value}. "
                f"Platform revenue tracking requires immutable treasury records.",
                None,
                None
            )


def protect_earning_ledger_immutability(mapper, connection, target):
    """
    Prevent modifications to EarningLedger after creation.
    """
    session = object_session(target)

    if session is None:
        return

    if target in session.new:
        return

    if target in session.deleted:
        return

    for field_name in IMMUTABLE_EARNING_LEDGER_FIELDS:
        history = session.get_history(target, field_name)

        if history.deleted and history.added:
            old_value = list(history.deleted)[0]
            new_value = list(history.added)[0]

            raise IntegrityError(
                f"Cannot modify immutable field {field_name} on EarningLedger {target.id}. "
                f"Old: {old_value}, New: {new_value}. "
                f"Provider earnings are locked for compliance and audit.",
                None,
                None
            )


# ===== REGISTRATION =====

def register_immutability_guards():
    """
    Register all immutability event listeners.

    Call this during application startup to enable DB-level write protection.
    """
    from sqlalchemy.orm import listen
    from sqlalchemy import event

    # Register before_update events
    event.listen(FeeLedger, "before_update", protect_fee_ledger_immutability)
    event.listen(TreasuryLedger, "before_update", protect_treasury_ledger_immutability)
    event.listen(EarningLedger, "before_update", protect_earning_ledger_immutability)
