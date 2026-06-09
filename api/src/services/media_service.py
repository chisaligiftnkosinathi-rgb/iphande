import os
import uuid
from fastapi import UploadFile
from datetime import datetime

MEDIA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'data', 'media')
os.makedirs(MEDIA_ROOT, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# Save uploaded media file to filesystem, return metadata
async def save_media_file(file: UploadFile):
    ext = ALLOWED_TYPES[file.content_type]
    media_id = str(uuid.uuid4())
    filename = file.filename or f"{media_id}{ext}"
    stored_filename = f"{media_id}{ext}"
    stored_path = os.path.join(MEDIA_ROOT, stored_filename)
    with open(stored_path, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
    created_at = datetime.utcnow()
    return {
        "media_id": media_id,
        "media_url": f"/api/v1/media/{media_id}",
        "filename": filename,
        "content_type": file.content_type,
        "created_at": created_at,
    }

def get_media_file_info(media_id: str):
    for content_type, ext in ALLOWED_TYPES.items():
        stored_filename = f"{media_id}{ext}"
        stored_path = os.path.join(MEDIA_ROOT, stored_filename)
        if os.path.exists(stored_path):
            return {
                "path": stored_path,
                "filename": stored_filename,
                "content_type": content_type,
            }
    return None
from src.models.timeline_event import TimelineEvent
from datetime import datetime

def create_media_timeline_event(db, media_id: str, event_type: str, description: str = None):
    event = TimelineEvent(
        opportunity_id=media_id,  # For V1, use media_id as opportunity_id for timeline linkage
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
