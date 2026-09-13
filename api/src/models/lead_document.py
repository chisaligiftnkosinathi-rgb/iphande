import enum
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from src.database import Base

class FICADocumentType(str, enum.Enum):
    SA_ID_DOCUMENT = "SA_ID_DOCUMENT"             # Smart ID card (front/back) or Green book
    PROOF_OF_RESIDENCE = "PROOF_OF_RESIDENCE"     # Utility bill, lease (< 3 months old)
    BANK_STATEMENTS_3MO = "BANK_STATEMENTS_3MO"   # 3 months official stamped bank statements
    PAYSLIP_LATEST = "PAYSLIP_LATEST"             # Latest 1-3 months payslips
    DRIVERS_LICENSE = "DRIVERS_LICENSE"           # Required for vehicle applications

class DocumentVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    PURGED = "PURGED"

class LeadFICADocument(Base):
    __tablename__ = "lead_fica_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SQLEnum(FICADocumentType), nullable=False)
    
    # Secure storage references (binary objects stored off-DB in encrypted bucket)
    storage_bucket = Column(String(100), nullable=False)
    storage_key = Column(String(255), nullable=False) # e.g. "fica/leads/<lead_id>/<doc_uuid>.pdf"
    file_mime_type = Column(String(50), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    
    # Integrity & Encryption
    kms_key_id = Column(String(255), nullable=True)
    sha256_checksum = Column(String(64), nullable=True) # Checksum confirmed upon upload
    
    verification_status = Column(
        SQLEnum(DocumentVerificationStatus), 
        default=DocumentVerificationStatus.PENDING,
        nullable=False,
        index=True
    )
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    purged_at = Column(DateTime(timezone=True), nullable=True)

class POPIAConsentLog(Base):
    __tablename__ = "popia_consent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("affiliate_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    id_number = Column(String(13), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=False)
    
    # Specific granular statutory consents under POPIA s11
    consented_to_credit_check = Column(Boolean, default=False, nullable=False)
    consented_to_dealership_sharing = Column(Boolean, default=False, nullable=False)
    consented_to_affiliate_forwarding = Column(Boolean, default=False, nullable=False)
    
    consent_version = Column(String(20), default="POPIA-v1.0-2026", nullable=False)
    raw_consent_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
