import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, get_database_status
from app.models.db_models import DBScheme, DBDocument, DBState
from app.services.assistant_service import assistant_service
from app.config import settings

router = APIRouter(prefix="/api/system", tags=["System Status"])


@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    db_stat = get_database_status()
    ai_stat = assistant_service.get_provider_status()
    schemes_count = db.query(DBScheme).filter_by(verification_status="verified").count()
    total_schemes = db.query(DBScheme).count()
    docs_count = db.query(DBDocument).count()

    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.APP_ENV,
        "database": db_stat,
        "ai_provider": ai_stat,
        "data_summary": {
            "total_schemes": total_schemes,
            "verified_schemes": schemes_count,
            "canonical_documents": docs_count,
        }
    }


@router.get("/states")
def get_states_and_districts(db: Session = Depends(get_db)):
    states = db.query(DBState).all()
    results = []
    for s in states:
        try:
            districts = json.loads(s.districts_json)
        except Exception:
            districts = []
        results.append({
            "code": s.code,
            "name": s.name,
            "name_hi": s.name_hi,
            "name_pa": s.name_pa,
            "is_ut": s.is_ut,
            "districts": districts
        })
    return results
