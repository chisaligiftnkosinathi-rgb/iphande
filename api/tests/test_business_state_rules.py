import pytest
from src.domain.business_state_rules import validate_transition

def test_valid_quote_transition():
    # valid quote transition passes
    validate_transition("Quote", "draft", "issued")
    validate_transition("Quote", "issued", "accepted")
    validate_transition("Quote", "issued", "expired")
    validate_transition("Quote", "issued", "cancelled")
    validate_transition("Quote", "accepted", "cancelled")

def test_invalid_quote_transition():
    # invalid quote transition raises
    with pytest.raises(ValueError, match="Invalid Quote transition: draft -> accepted"):
        validate_transition("Quote", "draft", "accepted")

def test_valid_invoice_transition():
    # valid invoice transition passes
    validate_transition("Invoice", "issued", "paid")
    validate_transition("Invoice", "partially_paid", "overdue")

def test_invalid_invoice_transition():
    # invalid invoice transition raises
    with pytest.raises(ValueError, match="Invalid Invoice transition: paid -> overdue"):
        validate_transition("Invoice", "paid", "overdue")

def test_valid_payment_transition():
    # valid payment transition passes
    validate_transition("PaymentIntent", "created", "pending")
    validate_transition("PaymentIntent", "pending", "confirmed")

def test_invalid_payment_transition():
    # invalid payment transition raises
    with pytest.raises(ValueError, match="Invalid PaymentIntent transition: confirmed -> pending"):
        validate_transition("PaymentIntent", "confirmed", "pending")
