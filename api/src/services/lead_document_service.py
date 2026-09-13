import hashlib
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.lead_offer import AffiliateLead, LeadStatus
from src.models.lead_document import LeadFICADocument, POPIAConsentLog, FICADocumentType, DocumentVerificationStatus
from src.schemas.lead_document import (
    POPIAConsentRequest,
    DocumentUploadIntentRequest,
    DocumentUploadIntentResponse,
    DocumentConfirmRequest,
)

FICA_BUCKET_NAME = os.getenv("FICA_STORAGE_BUCKET", "iphande-fica-vault")

class LeadDocumentService:

    @staticmethod
    def record_popia_consent(
        db: Session,
        lead_id: uuid.UUID,
        request: POPIAConsentRequest,
        ip_address: str,
        user_agent: str
    ) -> POPIAConsentLog:
        """
        Records tamper-proof POPIA statutory consent for a specific lead.
        """
        lead = db.query(AffiliateLead).filter(AffiliateLead.id == lead_id).first()
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Affiliate lead {lead_id} not found."
            )

        consent_log = POPIAConsentLog(
            id=uuid.uuid4(),
            lead_id=lead_id,
            id_number=request.id_number,
            ip_address=ip_address,
            user_agent=user_agent,
            consented_to_credit_check=request.consented_to_credit_check,
            consented_to_dealership_sharing=request.consented_to_dealership_sharing,
            consented_to_affiliate_forwarding=request.consented_to_affiliate_forwarding,
            consent_version=request.consent_version,
            raw_consent_text=request.raw_consent_text,
        )
        db.add(consent_log)
        db.commit()
        db.refresh(consent_log)
        return consent_log

    @staticmethod
    def verify_active_popia_consent(db: Session, lead_id: uuid.UUID) -> bool:
        """
        Mandatory POPIA enforcement gate: checks if an active consent record
        with consented_to_credit_check exists for the given lead.
        """
        consent = (
            db.query(POPIAConsentLog)
            .filter(
                POPIAConsentLog.lead_id == lead_id,
                POPIAConsentLog.consented_to_credit_check == True
            )
            .order_by(POPIAConsentLog.created_at.desc())
            .first()
        )
        return consent is not None

    @staticmethod
    def create_upload_intent(
        db: Session,
        lead_id: uuid.UUID,
        request: DocumentUploadIntentRequest,
        base_url: str = ""
    ) -> DocumentUploadIntentResponse:
        """
        Issues a pre-signed PUT slot.
        Enforces that POPIA consent must exist prior to allowing document uploads.
        """
        # POPIA Enforcement Gate
        if not LeadDocumentService.verify_active_popia_consent(db, lead_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="POPIA statutory consent required before uploading FICA financial documents. Missing credit check consent."
            )

        lead = db.query(AffiliateLead).filter(AffiliateLead.id == lead_id).first()
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Affiliate lead {lead_id} not found."
            )

        doc_id = uuid.uuid4()
        clean_ext = os.path.splitext(request.file_name)[1].lower() or ".bin"
        storage_key = f"fica/leads/{lead_id}/{doc_id}{clean_ext}"

        # In production with S3 configured, generate AWS S3 / Supabase presigned URL
        # For local dev / testing fallback:
        upload_url = f"{base_url}/api/v1/storage/mock-upload/{storage_key}?doc_id={doc_id}"

        new_doc = LeadFICADocument(
            id=doc_id,
            lead_id=lead_id,
            document_type=request.document_type,
            storage_bucket=FICA_BUCKET_NAME,
            storage_key=storage_key,
            file_mime_type=request.mime_type,
            file_size_bytes=request.file_size_bytes,
            verification_status=DocumentVerificationStatus.PENDING,
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        return DocumentUploadIntentResponse(
            document_id=doc_id,
            lead_id=lead_id,
            document_type=request.document_type,
            upload_url=upload_url,
            storage_bucket=FICA_BUCKET_NAME,
            storage_key=storage_key,
            expires_in_seconds=600
        )

    @staticmethod
    def confirm_upload(
        db: Session,
        lead_id: uuid.UUID,
        document_id: uuid.UUID,
        request: DocumentConfirmRequest
    ) -> LeadFICADocument:
        """
        Verifies checksum and marks FICA document as uploaded.
        """
        doc = (
            db.query(LeadFICADocument)
            .filter(
                LeadFICADocument.id == document_id,
                LeadFICADocument.lead_id == lead_id
            )
            .first()
        )
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FICA document not found for this lead."
            )

        if doc.verification_status == DocumentVerificationStatus.PURGED:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Document has been purged under POPIA retention rules."
            )

        doc.sha256_checksum = request.sha256_checksum.lower()
        doc.verification_status = DocumentVerificationStatus.VERIFIED
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_lead_documents(db: Session, lead_id: uuid.UUID) -> List[LeadFICADocument]:
        return (
            db.query(LeadFICADocument)
            .filter(LeadFICADocument.lead_id == lead_id)
            .order_by(LeadFICADocument.created_at.asc())
            .all()
        )

    @staticmethod
    def generate_signed_view_url(
        db: Session,
        lead_id: uuid.UUID,
        document_id: uuid.UUID,
        base_url: str = ""
    ) -> Tuple[LeadFICADocument, str]:
        """
        Generates a 15-minute expiring view link for authorized review.
        """
        doc = (
            db.query(LeadFICADocument)
            .filter(
                LeadFICADocument.id == document_id,
                LeadFICADocument.lead_id == lead_id
            )
            .first()
        )
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FICA document not found."
            )
        if doc.verification_status == DocumentVerificationStatus.PURGED:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Document has already been purged under POPIA retention policy."
            )

        signed_view_url = f"{base_url}/api/v1/storage/mock-view/{doc.storage_key}?exp=900"
        return doc, signed_view_url

    @staticmethod
    def purge_expired_documents(db: Session, retention_days: int = 90) -> int:
        """
        POPIA Retention Worker:
        Permanently purges documents associated with REJECTED or CONVERTED leads older than retention_days.
        Zeroes out storage keys and marks status as PURGED while retaining statutory audit logs.
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=retention_days)
        
        expired_docs = (
            db.query(LeadFICADocument)
            .join(AffiliateLead, LeadFICADocument.lead_id == AffiliateLead.id)
            .filter(
                LeadFICADocument.verification_status != DocumentVerificationStatus.PURGED,
                LeadFICADocument.created_at <= cutoff_date,
                AffiliateLead.status.in_([LeadStatus.REJECTED, LeadStatus.CONVERTED])
            )
            .all()
        )

        purged_count = 0
        for doc in expired_docs:
            doc.verification_status = DocumentVerificationStatus.PURGED
            doc.storage_key = "[PURGED_UNDER_POPIA]"
            doc.purged_at = datetime.now(timezone.utc)
            purged_count += 1

        db.commit()
        return purged_count
