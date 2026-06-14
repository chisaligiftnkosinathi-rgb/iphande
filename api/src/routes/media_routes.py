from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import get_db, replay_transaction
from src.auth.supabase_auth import get_current_user
from src.schemas.media_schema import EvidenceUploadIn, MediaOut
from src.models.media import Media
from src.services.continuity_event_service import emit_continuity_event
import os

router = APIRouter()

ALLOWED_BUCKETS = {
    "profile-logos",
    "business-documents",
    "proof-of-work",
    "payment-proofs"
}

@router.post("/media/evidence", response_model=MediaOut)
def record_evidence(
    payload: EvidenceUploadIn, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Strict evidence preservation endpoint.
    Frontend uploads to Supabase Storage, then sends the URL here.
    """
    if payload.bucket_name not in ALLOWED_BUCKETS:
        raise HTTPException(status_code=400, detail=f"Invalid bucket. Allowed: {ALLOWED_BUCKETS}")

    uid = current_user.get("uid")

    with replay_transaction(db):
        # Create Media DB record
        db_media = Media(
            owner_profile_id=payload.profile_id,
            title=f"{payload.purpose} Evidence",
            media_type=payload.bucket_name,
            file_url=payload.public_url,
            storage_provider="supabase",
            storage_origin="human_device",
            is_public=(payload.bucket_name == "profile-logos" or payload.bucket_name == "proof-of-work")
        )
        db.add(db_media)
        db.flush()

        # Emit ContinuityEvent for strict evidence
        if payload.bucket_name in ["proof-of-work", "business-documents", "payment-proofs"]:
            emit_continuity_event(
                db=db,
                business_owner_id=payload.profile_id,
                business_category_key=None,
                business_line=None,
                event_type="evidence_captured",
                actor_type="business_owner",
                actor_id=payload.profile_id,
                related_entity_type="media",
                related_entity_id=db_media.id,
                description=f"Captured {payload.purpose}",
                opportunity_id=payload.opportunity_id,
                quote_id=payload.quote_id
            )

        return db_media
