import os
import uuid
import aiofiles
import shutil
from fastapi import UploadFile, HTTPException
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------
# SAFE MEDIA STORAGE ROOT
# ---------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_ROOT = os.path.join(BASE_DIR, "data", "media")
TEMP_MEDIA_ROOT = os.path.join(BASE_DIR, "data", "temp_media")

os.makedirs(MEDIA_ROOT, exist_ok=True)
os.makedirs(TEMP_MEDIA_ROOT, exist_ok=True)

# ---------------------------------------------------
# SECURITY CONFIG
# ---------------------------------------------------

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# ---------------------------------------------------
# SAVE MEDIA FILE (ASYNC SAFE, TRANSACTIONAL)
# ---------------------------------------------------

async def save_media_file_temp(file: UploadFile):
    """
    Step 1: Save the uploaded file to a temporary directory.
    Validates size and mime type.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty upload or missing filename")
        
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    media_id = str(uuid.uuid4())
    ext = ALLOWED_TYPES[file.content_type]

    stored_filename = f"{media_id}{ext}"
    temp_path = os.path.join(TEMP_MEDIA_ROOT, stored_filename)

    total_size = 0

    try:
        async with aiofiles.open(temp_path, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File too large")

                await out.write(chunk)
                
        if total_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Failed to store media file to temp: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to store media file temporarily")

    return {
        "media_id": media_id,
        "temp_path": temp_path,
        "media_url": f"/api/v1/media/files/{media_id}",
        "filename": file.filename,
        "stored_filename": stored_filename,
        "content_type": file.content_type,
        "size_bytes": total_size,
        "created_at": datetime.utcnow(),
    }


def finalize_media_file(temp_path: str, stored_filename: str):
    """
    Step 2: Move the temporary file to its final destination after DB commit.
    """
    final_path = os.path.join(MEDIA_ROOT, stored_filename)
    try:
        if os.path.exists(temp_path):
            shutil.move(temp_path, final_path)
        else:
            logger.error(f"Temp file missing during finalization: {temp_path}")
            raise Exception("Temporary file lost before finalization")
    except Exception as e:
        logger.error(f"Failed to finalize media file: {str(e)}", exc_info=True)
        raise e


def cleanup_temp_media_file(temp_path: str):
    """
    Rollback: Delete the temporary file if the DB transaction fails.
    """
    try:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
    except Exception as e:
        logger.error(f"Failed to clean up temp media file {temp_path}: {str(e)}", exc_info=True)


async def save_media_file(file: UploadFile):
    """
    Backward compatible single-step upload for endpoints that don't need transactional DB logic yet.
    """
    info = await save_media_file_temp(file)
    finalize_media_file(info["temp_path"], info["stored_filename"])
    return info


# ---------------------------------------------------
# GET MEDIA FILE INFO
# ---------------------------------------------------

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

def delete_media_file_by_id(media_id: str):
    info = get_media_file_info(media_id)
    if info and os.path.exists(info["path"]):
        try:
            os.remove(info["path"])
        except Exception as e:
            logger.error(f"Failed to delete media {media_id}: {str(e)}", exc_info=True)

