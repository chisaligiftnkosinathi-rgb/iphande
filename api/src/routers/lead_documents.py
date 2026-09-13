import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.lead_document import (
    POPIAConsentRequest,
    POPIAConsentResponse,
    DocumentUploadIntentRequest,
    DocumentUploadIntentResponse,
    DocumentConfirmRequest,
    LeadFICADocumentResponse,
    SignedViewUrlResponse,
)
from src.services.lead_document_service import LeadDocumentService

router = APIRouter(prefix="/affiliates/leads", tags=["FICA & POPIA Lead Documents"])

@router.post("/{lead_id}/consent", response_model=POPIAConsentResponse, status_code=status.HTTP_201_CREATED)
def record_popia_consent(
    lead_id: uuid.UUID,
    payload: POPIAConsentRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Records statutory POPIA explicit consent prior to processing credit/vehicle inquiries or documents.
    """
    ip_address = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")
    return LeadDocumentService.record_popia_consent(
        db=db,
        lead_id=lead_id,
        request=payload,
        ip_address=ip_address,
        user_agent=user_agent
    )

@router.post("/{lead_id}/documents/upload-intent", response_model=DocumentUploadIntentResponse)
def request_document_upload_intent(
    lead_id: uuid.UUID,
    payload: DocumentUploadIntentRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Issues a direct-to-storage pre-signed upload URL.
    STRICT GATE: Blocks with 403 Forbidden if POPIA credit check consent has not been logged.
    """
    base_url = str(request.base_url).rstrip("/")
    return LeadDocumentService.create_upload_intent(
        db=db,
        lead_id=lead_id,
        request=payload,
        base_url=base_url
    )

@router.post("/{lead_id}/documents/{document_id}/confirm", response_model=LeadFICADocumentResponse)
def confirm_document_upload(
    lead_id: uuid.UUID,
    document_id: uuid.UUID,
    payload: DocumentConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Confirms direct storage upload and records client-calculated SHA-256 integrity hash.
    """
    return LeadDocumentService.confirm_upload(
        db=db,
        lead_id=lead_id,
        document_id=document_id,
        request=payload
    )

@router.get("/{lead_id}/documents", response_model=List[LeadFICADocumentResponse])
def list_lead_documents(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Lists uploaded FICA documents for an inquiry without exposing unauthenticated raw files.
    """
    return LeadDocumentService.get_lead_documents(db=db, lead_id=lead_id)

@router.get("/{lead_id}/documents/{document_id}/signed-url", response_model=SignedViewUrlResponse)
def get_document_signed_view_url(
    lead_id: uuid.UUID,
    document_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generates a time-expiring (15-minute) signed view URL for vetted internal or dealership reviewers.
    """
    base_url = str(request.base_url).rstrip("/")
    doc, signed_url = LeadDocumentService.generate_signed_view_url(
        db=db,
        lead_id=lead_id,
        document_id=document_id,
        base_url=base_url
    )
    return SignedViewUrlResponse(
        document_id=doc.id,
        document_type=doc.document_type,
        signed_view_url=signed_url,
        expires_in_seconds=900
    )

@router.post("/documents/purge-expired")
def purge_expired_documents(
    retention_days: int = 90,
    db: Session = Depends(get_db)
):
    """
    Regulatory POPIA worker: purges documents from rejected/converted applications exceeding the 90-day retention window.
    """
    purged_count = LeadDocumentService.purge_expired_documents(db=db, retention_days=retention_days)
    return {"status": "success", "purged_count": purged_count, "retention_days": retention_days}

# Mock Storage Gateway Router for Development & Testing
storage_router = APIRouter(prefix="/storage", tags=["Storage Gateway (Dev/Testing)"])

@storage_router.put("/mock-upload/{path:path}")
async def mock_upload_handler(path: str, request: Request):
    """
    Accepts direct client uploads in dev/test environments.
    """
    body = await request.body()
    return Response(
        content=f'{{"status": "uploaded", "size": {len(body)}}}',
        media_type="application/json",
        status_code=200
    )

@storage_router.get("/mock-view/{path:path}")
async def mock_view_handler(path: str):
    """
    Mock download view endpoint for dev/test environments.
    """
    return Response(
        content=b"%PDF-1.4 Mock Document Content For Verification",
        media_type="application/pdf",
        status_code=200
    )
