import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from src.models.lead_document import FICADocumentType, DocumentVerificationStatus

class POPIAConsentRequest(BaseModel):
    id_number: str = Field(..., min_length=13, max_length=13, description="13-digit SA National ID number")
    consented_to_credit_check: bool = Field(True, description="Statutory consent for credit bureau evaluation")
    consented_to_dealership_sharing: bool = Field(True, description="Consent to share financial profile with vetted dealership")
    consented_to_affiliate_forwarding: bool = Field(False, description="Optional consent for ancillary insurance/tracker offers")
    consent_version: str = Field("POPIA-v1.0-2026", description="Consent policy version")
    raw_consent_text: str = Field(..., description="Exact statutory text acknowledged by the applicant")

class POPIAConsentResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    id_number: str
    consented_to_credit_check: bool
    consented_to_dealership_sharing: bool
    consented_to_affiliate_forwarding: bool
    consent_version: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentUploadIntentRequest(BaseModel):
    document_type: FICADocumentType
    file_name: str
    file_size_bytes: int = Field(..., gt=0, le=15 * 1024 * 1024, description="Max 15MB file size")
    mime_type: str = Field(..., description="MIME type e.g. application/pdf, image/jpeg, image/png")

class DocumentUploadIntentResponse(BaseModel):
    document_id: uuid.UUID
    lead_id: uuid.UUID
    document_type: FICADocumentType
    upload_url: str
    storage_bucket: str
    storage_key: str
    expires_in_seconds: int = 600

class DocumentConfirmRequest(BaseModel):
    sha256_checksum: str = Field(..., min_length=64, max_length=64, description="SHA-256 integrity checksum calculated by client")

class LeadFICADocumentResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    document_type: FICADocumentType
    storage_bucket: str
    storage_key: str
    file_mime_type: str
    file_size_bytes: int
    sha256_checksum: Optional[str] = None
    verification_status: DocumentVerificationStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    purged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SignedViewUrlResponse(BaseModel):
    document_id: uuid.UUID
    document_type: FICADocumentType
    signed_view_url: str
    expires_in_seconds: int = 900
