import logging
from typing import Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("civiconnect.database")

Base = declarative_base()


def normalize_database_url(url: str) -> str:
    """
    Ensure compatibility with SQLAlchemy 2.0 and cloud providers (Render, Heroku, Supabase, Neon).
    - Rewrites legacy 'postgres://' scheme to 'postgresql+psycopg://' (Psycopg 3)
    - Normalizes bare 'postgresql://' to 'postgresql+psycopg://' (Psycopg 3)
    - Preserves explicit drivers like 'postgresql+psycopg2://' and 'sqlite://'
    """
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def mask_database_url(url: str) -> str:
    """Mask credentials in database URL to prevent credential leakage in logs and status endpoints."""
    if not url:
        return url
    try:
        if "@" in url:
            prefix, rest = url.split("://", 1)
            auth, host_path = rest.split("@", 1)
            return f"{prefix}://***:***@{host_path}"
    except Exception:
        pass
    return url


db_status: Dict[str, Any] = {
    "target_url": mask_database_url(settings.DATABASE_URL),
    "active_dialect": "unknown",
    "is_connected": False,
    "fallback_active": False,
    "error_message": None,
    "setup_guide": None
}

engine = None
SessionLocal = None


def setup_database_engine():
    global engine, SessionLocal, db_status

    target_url = normalize_database_url(settings.DATABASE_URL)
    is_postgres = "postgres" in target_url.lower()

    if is_postgres:
        try:
            logger.info(f"Attempting connection to PostgreSQL at {mask_database_url(target_url)}")
            pg_engine = create_engine(
                target_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 5}
            )
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            engine = pg_engine
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db_status.update({
                "target_url": mask_database_url(target_url),
                "active_dialect": "postgresql",
                "is_connected": True,
                "fallback_active": False,
                "error_message": None,
                "setup_guide": "Connected to PostgreSQL database."
            })
            logger.info("Successfully connected to primary PostgreSQL database.")
            return engine
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"PostgreSQL connection failed: {err_msg}")
            
            if not settings.ALLOW_SQLITE_FALLBACK:
                db_status.update({
                    "active_dialect": "postgresql",
                    "is_connected": False,
                    "fallback_active": False,
                    "error_message": err_msg,
                    "setup_guide": (
                        "PostgreSQL is required but unreachable. Ensure PostgreSQL service is running, "
                        "the database 'civiconnect_db' exists, and credentials in DATABASE_URL are valid."
                    )
                })
                raise RuntimeError(f"Database connection error: {err_msg}")

            logger.info("Falling back to local SQLite database as configured by ALLOW_SQLITE_FALLBACK=true.")
            fallback_engine = create_engine(
                settings.SQLITE_FALLBACK_URL,
                connect_args={"check_same_thread": False}
            )
            engine = fallback_engine
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db_status.update({
                "active_dialect": "sqlite",
                "is_connected": True,
                "fallback_active": True,
                "error_message": f"Primary PostgreSQL connection failed ({err_msg[:120]}...). Active in documented SQLite development mode.",
                "setup_guide": (
                    "Running on SQLite fallback (civiconnect.db). To switch to PostgreSQL: "
                    "1. Create database: `CREATE DATABASE civiconnect_db;` "
                    "2. Update DATABASE_URL in .env: `postgresql+psycopg2://<user>:<password>@localhost:5432/civiconnect_db` "
                    "3. Run backend migrations / seeds."
                )
            })
            return engine
    else:
        # SQLite requested explicitly
        sqlite_engine = create_engine(
            target_url,
            connect_args={"check_same_thread": False}
        )
        engine = sqlite_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db_status.update({
            "active_dialect": "sqlite",
            "is_connected": True,
            "fallback_active": False,
            "error_message": None,
            "setup_guide": "Explicitly configured for SQLite."
        })
        return engine


setup_database_engine()


def get_db():
    global SessionLocal
    if SessionLocal is None:
        setup_database_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    global engine
    if engine is None:
        setup_database_engine()
    from app.models import db_models
    Base.metadata.create_all(bind=engine)


def get_database_status() -> Dict[str, Any]:
    global db_status
    stat = db_status.copy()
    if "target_url" in stat and stat["target_url"]:
        stat["target_url"] = mask_database_url(stat["target_url"])
    return stat
