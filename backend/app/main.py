import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.services.seed_service import SeedService
from app.api.auth_router import router as auth_router
from app.api.schemes_router import router as schemes_router
from app.api.eligibility_router import router as eligibility_router
from app.api.documents_router import router as documents_router
from app.api.checklists_router import router as checklists_router
from app.api.user_router import router as user_router
from app.api.assistant_router import router as assistant_router
from app.api.admin_router import router as admin_router
from app.api.system_router import router as system_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("civiconnect")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CiviConnect backend...")
    init_db()
    try:
        stats = SeedService.seed_all()
        logger.info(f"Database readiness verified: {stats}")
    except Exception as e:
        logger.error(f"Startup seeding warning: {e}")
    yield
    logger.info("CiviConnect backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Independent, multilingual public-service information and government scheme navigation platform for India.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development for ease of use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(system_router)
app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(documents_router)
app.include_router(checklists_router)
app.include_router(user_router)
app.include_router(assistant_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "service": "CiviConnect Public Service Navigation API",
        "status": "operational",
        "documentation": "/docs",
        "version": settings.PROJECT_VERSION,
        "disclaimer": "CiviConnect is an independent public-service information platform. Not an official government website."
    }
