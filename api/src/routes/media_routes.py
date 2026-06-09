


from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from src.schemas.media_schema import MediaUploadOut
from src.services.media_service import save_media_file, get_media_file_info
import os

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@router.post("/media/upload", response_model=MediaUploadOut)
async def upload_media(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")
    media_info = await save_media_file(file)
    return media_info


# Minimal media replay endpoint
@router.get("/media/{media_id}")
def get_media(media_id: str):
    file_info = get_media_file_info(media_id)
    if not file_info or not os.path.exists(file_info["path"]):
        raise HTTPException(status_code=404, detail="Media not found")
    return FileResponse(
        file_info["path"],
        media_type=file_info["content_type"],
        filename=file_info["filename"]
    )

# @router.post("/media/ingest", response_model=MediaOut)
# async def ingest_media(
#     file: UploadFile = File(...),
#     owner_profile_id: str = Form(...),
#     media_type: str = Form(...),
#     source: str = Form("human_device"),
#     allow_exif_processing: bool = Form(False),
#     allow_location_extraction: bool = Form(False),
#     db: Session = Depends(get_db)
# ):
#     with replay_transaction(db):
#         db_media = Media(
#             owner_profile_id=owner_profile_id,
#             title=file.filename,
#             media_type=media_type,
#             file_url=f"/local/{file.filename}", # Placeholder for actual cloud storage path
#             local_file_path=file.filename,
#             storage_origin=source,
#             storage_provider="local",
#             allow_exif_processing=allow_exif_processing,
#             allow_location_extraction=allow_location_extraction
#         )
#         db.add(db_media)
#         db.flush()
#
#         event = emit_continuity_event(
#             db,
#             business_owner_id=owner_profile_id,
#             business_category_key=None,
#             business_line=None,
#             event_type="media_ingested",
#             actor_type="business_owner",
#             actor_id=owner_profile_id,
#             related_entity_type="media",

#                 "surface": "media",
