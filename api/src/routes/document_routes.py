from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uuid

from src.database import get_db
from src.core.security import get_current_user
from src.services.verification_service import require_verified_steward_or_platform_admin
from src.models.profile import Profile
from src.models.quote import Quote
from src.models.invoice import Invoice
from src.services.document_engine import generate_quote_pdf, generate_invoice_pdf

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

@router.get("/quotes/{document_id}/pdf")
def download_quote_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.owner_id == user["uid"]).first()
    require_verified_steward_or_platform_admin(profile)
    
    quote = db.query(Quote).filter(Quote.id == document_id, Quote.business_owner_id == profile.id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    pdf_buffer = generate_quote_pdf(quote, profile)
    
    headers = {
        'Content-Disposition': f'inline; filename="Quote_{document_id}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

@router.get("/invoices/{document_id}/pdf")
def download_invoice_pdf(
    document_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.owner_id == user["uid"]).first()
    require_verified_steward_or_platform_admin(profile)
    
    invoice = db.query(Invoice).filter(Invoice.id == document_id, Invoice.business_owner_id == profile.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    quote = db.query(Quote).filter(Quote.id == invoice.quote_id).first()
        
    pdf_buffer = generate_invoice_pdf(invoice, quote, profile)
    
    headers = {
        'Content-Disposition': f'inline; filename="Invoice_{document_id}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
