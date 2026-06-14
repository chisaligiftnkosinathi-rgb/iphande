import pytest
from datetime import datetime
from src.services.document_engine import generate_quote_pdf, generate_invoice_pdf
from src.models.profile import Profile
from src.models.quote import Quote
from src.models.invoice import Invoice

def test_generate_quote_pdf():
    profile = Profile(
        id="test-profile",
        name="Test Business",
        email="test@example.com",
        phone="0812345678",
        created_at=datetime.utcnow()
    )
    quote = Quote(
        id="test-quote",
        business_owner_id="test-profile",
        customer_name="Test Customer",
        customer_phone="0823456789",
        description="Fixing a leak",
        amount=1500.0,
        subtotal=1500.0,
        vat=0.0,
        status="sent",
        created_at=datetime.utcnow()
    )
    
    pdf_buffer = generate_quote_pdf(quote, profile)
    
    assert pdf_buffer is not None
    pdf_bytes = pdf_buffer.read()
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000

def test_generate_invoice_pdf():
    profile = Profile(
        id="test-profile",
        name="Test Business",
        email="test@example.com",
        phone="0812345678",
        created_at=datetime.utcnow()
    )
    quote = Quote(
        id="test-quote",
        business_owner_id="test-profile",
        customer_name="Test Customer",
        description="Fixing a leak",
        amount=1500.0,
        status="accepted",
        created_at=datetime.utcnow()
    )
    invoice = Invoice(
        id="test-invoice",
        business_owner_id="test-profile",
        quote_id="test-quote",
        amount=1500.0,
        status="sent",
        created_at=datetime.utcnow()
    )
    
    pdf_buffer = generate_invoice_pdf(invoice, quote, profile)
    
    assert pdf_buffer is not None
    pdf_bytes = pdf_buffer.read()
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000
