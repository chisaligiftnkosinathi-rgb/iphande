def test_debug_media_routes():
    from src.main import app
    for route in app.routes:
        print(route.path, route.methods)
    assert True
import os
import io
import uuid
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

TEST_IMAGE_PATH = os.path.join(os.path.dirname(__file__), "test_image.jpg")

# Utility: create a small JPEG file for upload tests
def create_test_jpeg(path):
    from PIL import Image
    img = Image.new("RGB", (10, 10), color="red")
    img.save(path, "JPEG")

if not os.path.exists(TEST_IMAGE_PATH):
    try:
        from PIL import Image
        create_test_jpeg(TEST_IMAGE_PATH)
    except ImportError:
        # Fallback: create a dummy file
        with open(TEST_IMAGE_PATH, "wb") as f:
            f.write(b"\xff\xd8\xff\xd9")  # minimal JPEG

def test_upload_jpeg_returns_media_id_and_url():
    with open(TEST_IMAGE_PATH, "rb") as f:
        response = client.post("/api/v1/media/upload", files={"file": ("test.jpg", f, "image/jpeg")})
    assert response.status_code == 200
    data = response.json()
    assert "media_id" in data
    assert data["media_url"].startswith("/api/v1/media/")
    assert data["content_type"] == "image/jpeg"
    assert data["filename"] == "test.jpg"
    assert "created_at" in data

def test_reject_unsupported_content_type():
    response = client.post("/api/v1/media/upload", files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")})
    assert response.status_code == 415

def test_uploaded_media_can_be_replayed():
    with open(TEST_IMAGE_PATH, "rb") as f:
        upload = client.post("/api/v1/media/upload", files={"file": ("test.jpg", f, "image/jpeg")})
    media_id = upload.json()["media_id"]
    get_resp = client.get(f"/api/v1/media/{media_id}")
    assert get_resp.status_code == 200
    assert get_resp.headers["content-type"] == "image/jpeg"

def test_stored_filename_is_uuid_based():
    with open(TEST_IMAGE_PATH, "rb") as f:
        upload = client.post("/api/v1/media/upload", files={"file": ("test.jpg", f, "image/jpeg")})
    media_id = upload.json()["media_id"]
    # Check file exists with UUID-based name
    from src.services.media_service import MEDIA_ROOT
    found = False
    for ext in [".jpg", ".png", ".webp"]:
        path = os.path.join(MEDIA_ROOT, f"{media_id}{ext}")
        if os.path.exists(path):
            found = True
    assert found

def test_no_ocr_or_classification_fields_returned():
    with open(TEST_IMAGE_PATH, "rb") as f:
        upload = client.post("/api/v1/media/upload", files={"file": ("test.jpg", f, "image/jpeg")})
    data = upload.json()
    forbidden = ["ocr", "classification", "ai", "insight"]
    for key in forbidden:
        for field in data:
            assert key not in field.lower()
