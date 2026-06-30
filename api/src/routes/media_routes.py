from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form, Request
from fastapi.responses import FileResponse
from src.core.security import get_current_user
from src.models.profile import Profile
from sqlalchemy.orm import Session
from datetime import datetime
import os
import logging

from src.schemas.media_schema import (
    MediaUploadOut,
    MediaOut,
    MediaAnalysisOut,
    MediaUpdate,
    MediaDraftApprove,
    MediaDraftReject,
    MediaDraftCorrect,
)

from src.services.media_service import (
    save_media_file,
    save_media_file_temp,
    finalize_media_file,
    cleanup_temp_media_file,
    get_media_file_info,
)

from src.database import get_db
from src.models import Media

from src.database import replay_transaction
from src.services.continuity_event_service import emit_continuity_event
from src.core.rate_limit import limiter

router = APIRouter()
logger = logging.getLogger(__name__)

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# ---------------------------------------------------
# BASIC FILE UPLOAD (local storage abstraction)
# ---------------------------------------------------

@router.post("/upload", response_model=MediaUploadOut)
@limiter.limit("10/minute")
async def upload_media(request: Request, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Secure direct file upload. Used when uploading file prior to profile generation.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    return await save_media_file(file)


# ---------------------------------------------------
# FILE REPLAY (raw file serving)
# ---------------------------------------------------

@router.get("/files/{media_id}")
def get_media_file(media_id: str):
    file_info = get_media_file_info(media_id)

    if not file_info or not os.path.exists(file_info["path"]):
        raise HTTPException(status_code=404, detail="Media not found")

    return FileResponse(
        file_info["path"],
        media_type=file_info["content_type"],
        filename=file_info["filename"],
    )


# ---------------------------------------------------
# DB INGESTION
# ---------------------------------------------------

@router.post("/media/ingest", response_model=MediaOut)
@limiter.limit("10/minute")
async def ingest_media(
    request: Request,
    file: UploadFile = File(...),
    owner_profile_id: str = Form(...),
    media_type: str = Form(...),
    source: str = Form("human_device"),
    allow_exif_processing: bool = Form(False),
    allow_location_extraction: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    profile = db.query(Profile).filter(Profile.id == owner_profile_id).first()
    if not profile or profile.owner_id != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to ingest media for this profile")
        
    # Step 1: Save file to temp location
    temp_file_info = await save_media_file_temp(file)
    
    try:
        # Step 2: Database transaction
        with replay_transaction(db):
            db_media = Media(
                owner_profile_id=owner_profile_id,
                title=temp_file_info["filename"],
                media_type=media_type,
                file_url=temp_file_info["media_url"],
                local_file_path=temp_file_info["stored_filename"],
                storage_origin=source,
                storage_provider="local",
                allow_exif_processing=allow_exif_processing,
                allow_location_extraction=allow_location_extraction,
            )

            db.add(db_media)
            db.flush()

            event = emit_continuity_event(
                db,
                business_owner_id=owner_profile_id,
                business_category_key=None,
                business_line=None,
                event_type="media_ingested",
                actor_type="business_owner",
                actor_id=owner_profile_id,
                related_entity_type="media",
                related_entity_id=str(db_media.id),
                parent_event_id=None,
                payload={
                    "surface": "media",
                    "action": "ingested",
                    "source": source,
                    "media_type": media_type,
                    "summary_available": True,
                },
                auto_commit=False,
            )

            db_media.continuity_event_id = str(event.id)
            db.flush()
            db.refresh(db_media)
            
        # Step 3: Finalize file if DB transaction succeeded
        finalize_media_file(temp_file_info["temp_path"], temp_file_info["stored_filename"])
        
    except Exception as e:
        # Rollback: Clean up temp file
        cleanup_temp_media_file(temp_file_info.get("temp_path"))
        logger.error(f"Failed to ingest media, transaction aborted: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to ingest media")

    return db_media


# ---------------------------------------------------
# ANALYSIS (deterministic placeholder engine)
# ---------------------------------------------------

@router.post("/media/{media_id}/analyze", response_model=MediaAnalysisOut)
def analyze_media(media_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    media = db.query(Media).filter(Media.id == media_id).first()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    profile = db.query(Profile).filter(Profile.id == media.owner_profile_id).first()
    if not profile or profile.owner_id != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to modify this media")

    with replay_transaction(db):
        emit_continuity_event(
            db,
            business_owner_id=media.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="media_analyzed",
            actor_type="system",
            actor_id="deterministic_analyzer",
            related_entity_type="media",
            related_entity_id=str(media.id),
            parent_event_id=getattr(media, "continuity_event_id", None),
            payload={
                "surface": "media",
                "action": "analyzed",
                "summary_available": True,
                "human_approval_required": True,
            },
            auto_commit=False,
        )

    return MediaAnalysisOut(
        media_id=str(media.id),
        intent_hypothesis="This media may represent business content.",
        business_context_used=True,
        confidence_boundary="Provisional interpretation only.",
        context_sources_used=["media_record", "profile"],
        context_gaps=["No campaign linkage detected"],
        evidence_boundary="Based on available internal data only.",
        observations=[f"Detected {media.media_type} artifact"],
        suggested_caption="Review before publishing.",
        suggested_cta="Contact us for more details.",
    )


# ---------------------------------------------------
# LIST + READ
# ---------------------------------------------------

@router.get("/media", response_model=list[MediaOut])
def list_media(db: Session = Depends(get_db)):
    return db.query(Media).all()


@router.get("/media/{media_id}", response_model=MediaOut)
def get_media(media_id: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return media


# ---------------------------------------------------
# UPDATE
# ---------------------------------------------------

@router.patch("/media/{media_id}", response_model=MediaOut)
def update_media(media_id: str, update: MediaUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    media = db.query(Media).filter(Media.id == media_id).first()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    profile = db.query(Profile).filter(Profile.id == media.owner_profile_id).first()
    if not profile or profile.owner_id != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to modify this media")

    update_data = update.dict(exclude_unset=True)

    if not update_data:
        return media

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(media, key, value)

        media.updated_at = datetime.utcnow()

        event = emit_continuity_event(
            db,
            business_owner_id=media.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="media_amended",
            actor_type="business_owner",
            actor_id=media.owner_profile_id,
            related_entity_type="media",
            related_entity_id=str(media.id),
            parent_event_id=getattr(media, "continuity_event_id", None),
            payload={
                "surface": "media",
                "action": "amended",
                "updated_fields": list(update_data.keys()),
                "summary_available": True,
            },
            auto_commit=False,
        )

        media.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(media)

    return media


# ---------------------------------------------------
# DELETE (soft archive)
# ---------------------------------------------------

@router.delete("/media/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    media = db.query(Media).filter(Media.id == media_id).first()

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    profile = db.query(Profile).filter(Profile.id == media.owner_profile_id).first()
    if not profile or profile.owner_id != current_user.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized to modify this media")

    with replay_transaction(db):
        media.is_archived = True

        emit_continuity_event(
            db,
            business_owner_id=media.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="media_archived",
            actor_type="business_owner",
            actor_id=media.owner_profile_id,
            related_entity_type="media",
            related_entity_id=str(media.id),
            parent_event_id=getattr(media, "continuity_event_id", None),
            payload={
                "surface": "media",
                "action": "archived",
                "summary_available": True,
            },
            auto_commit=False,
        )

        db.flush()
        db.refresh(media)

    return {"detail": "Media archived"}