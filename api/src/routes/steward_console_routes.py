from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm

from src.database import get_db
from src.auth.supabase_auth import get_current_user
from src.services.verification_service import require_verified_steward
from src.models.profile import Profile
from src.services.document_engine import draw_header, draw_footer

router = APIRouter(prefix="/api/v1/steward-console", tags=["steward-console"])

def generate_vba_export_pdf(profile):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    
    doc_id = f"VBA-EXP-{str(profile.id).split('-')[0].upper()}"
    date_str = profile.created_at.strftime("%B %d, %Y") if profile.created_at else "Today"
    y = draw_header(c, profile, "VBA Export", doc_id, date_str)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2*cm, y, "Steward Console - Full Business Export")
    y -= 1*cm
    
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, y, "This document certifies the business records held by iPhande Steward Operating System.")
    y -= 1*cm
    
    c.drawString(2*cm, y, "Sections to follow in full implementation:")
    y -= 0.6*cm
    c.drawString(2.5*cm, y, "- Quotes")
    y -= 0.6*cm
    c.drawString(2.5*cm, y, "- Invoices & Receipts")
    y -= 0.6*cm
    c.drawString(2.5*cm, y, "- Expenses & Inventory")
    y -= 0.6*cm
    c.drawString(2.5*cm, y, "- Proof of Work")
    
    draw_footer(c, doc_id, date_str, profile.id, profile.id)
    c.save()
    buffer.seek(0)
    return buffer

@router.get("/export")
def export_steward_console(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    profile = db.query(Profile).filter(Profile.owner_id == user["uid"]).first()
    require_verified_steward(profile)
    
    pdf_buffer = generate_vba_export_pdf(profile)
    
    headers = {
        'Content-Disposition': f'attachment; filename="VBA_Export_{profile.id}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
