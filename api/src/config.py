from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_DATABASE_URL = f"sqlite:///{DATA_DIR / 'iphande.db'}"

class Settings(BaseSettings):
    # Required
    JWT_SECRET: str
    DATABASE_URL: str
    ENVIRONMENT: str
    DEPLOYMENT_MODE: str = "dev"  # dev, rc, pilot, prod
    
    # Optional with safe defaults
    APP_NAME: str = "iPhande API"
    API_VERSION: str = "0.1.0"
    REDIS_URL: str = ""
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006,https://iphande-production.up.railway.app"
    AUTO_CREATE_SCHEMA: bool = False
    AXIONYX_API_URL: str = "http://axionyx.railway.internal:8000"
    
    BOOTSTRAP_ADMIN_EMAILS: str = ""
    SYSTEM_CREATOR_EMAIL: str = ""  # The one person who bootstraps the platform on first sign-in
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        
    @property
    def bootstrap_admin_emails_list(self) -> list[str]:
        return [email.strip().lower() for email in self.BOOTSTRAP_ADMIN_EMAILS.split(",") if email.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Export variables for backward compatibility temporarily, though we will migrate consumers
APP_NAME = settings.APP_NAME
ENVIRONMENT = settings.ENVIRONMENT
API_VERSION = settings.API_VERSION
DATABASE_URL = settings.DATABASE_URL
JWT_SECRET = settings.JWT_SECRET
AXIONYX_API_URL = settings.AXIONYX_API_URL
CORS_ORIGINS = settings.cors_origins_list
BOOTSTRAP_ADMIN_EMAILS = settings.bootstrap_admin_emails_list
SYSTEM_CREATOR_EMAIL = settings.SYSTEM_CREATOR_EMAIL.strip().lower()
