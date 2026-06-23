import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_DATABASE_URL = f"sqlite:///{DATA_DIR / 'iphande.db'}"

APP_NAME = os.getenv("APP_NAME", "iPhande API")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
API_VERSION = os.getenv("API_VERSION", "0.1.0")
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
AXIONYX_API_URL = os.getenv("AXIONYX_API_URL", "http://axionyx.railway.internal:8000")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

BOOTSTRAP_ADMIN_EMAILS = [
    email.strip().lower()
    for email in os.getenv("BOOTSTRAP_ADMIN_EMAILS", "").split(",")
    if email.strip()
]
