import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Determine project root and locate .env file reliably
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ROOT_ENV = PROJECT_ROOT / ".env"
BACKEND_ENV = PROJECT_ROOT / "backend" / ".env"

# Explicitly load .env into os.environ before Settings instantiation
if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV, override=True)
elif BACKEND_ENV.exists():
    load_dotenv(BACKEND_ENV, override=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "CiviConnect"
    PROJECT_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_HOST: str = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

    # Database Configuration (PostgreSQL primary)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:CivicLocal2026Secure@localhost:5432/civiconnect_db"
    )
    ALLOW_SQLITE_FALLBACK: bool = os.getenv("ALLOW_SQLITE_FALLBACK", "false").lower() in ("true", "1", "yes")
    SQLITE_FALLBACK_URL: str = "sqlite:///./civiconnect.db"

    # AI Configuration (Gemini API via official google-genai SDK)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "25"))

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "civiconnect-production-grade-jwt-secret-key-32-chars-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Admin Defaults (for initial secure bootstrap)
    ADMIN_DEFAULT_EMAIL: str = os.getenv("ADMIN_DEFAULT_EMAIL", "admin@civiconnect.in")
    ADMIN_BOOTSTRAP_PASSWORD: Optional[str] = os.getenv("ADMIN_BOOTSTRAP_PASSWORD") or os.getenv("ADMIN_DEFAULT_PASSWORD")

    @property
    def ADMIN_DEFAULT_PASSWORD(self) -> str:
        if self.ADMIN_BOOTSTRAP_PASSWORD:
            return self.ADMIN_BOOTSTRAP_PASSWORD
        if self.APP_ENV in ("development", "test"):
            return "CivicAdmin@2026!"
        return ""

    # CORS
    FRONTEND_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://civi-connect-seven.vercel.app",
        "https://civiconnect.vercel.app",
    ]

    model_config = {
        "env_file": [str(ROOT_ENV), str(BACKEND_ENV), ".env"],
        "env_file_encoding": "utf-8",
        "extra": "allow"
    }


settings = Settings()
