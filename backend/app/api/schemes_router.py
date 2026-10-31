from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBScheme
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


@router.get("")
def list_schemes(
    category: Optional[str] = Query(None, description="Filter by category"),
    state: Optional[str] = Query(None, description="Filter by state (e.g. Punjab, Delhi)"),
    level: Optional[str] = Query(None, description="Filter by level: central or state"),
    search: Optional[str] = Query(None, description="Keyword search in name, description, department"),
    verification_status: Optional[str] = Query(None, description="Filter by status: verified, unverified"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    schemes = SchemeService.get_all_schemes(
        db=db,
        category=category,
        state=state,
        level=level,
        search=search,
        verification_status=verification_status,
        limit=limit,
        offset=offset
    )
    total_count = db.query(DBScheme).filter(DBScheme.status == "active").count()
    return {
        "total": total_count,
        "count": len(schemes),
        "limit": limit,
        "offset": offset,
        "items": schemes
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    schemes = db.query(DBScheme.category).distinct().all()
    categories = sorted(list({s[0] for s in schemes if s[0]}))
    category_counts = {}
    for cat in categories:
        count = db.query(DBScheme).filter(DBScheme.category == cat, DBScheme.status == "active").count()
        category_counts[cat] = count
    return {
        "categories": categories,
        "counts": category_counts
    }


@router.get("/{scheme_id}")
def get_scheme_detail(scheme_id: str, db: Session = Depends(get_db)):
    scheme = SchemeService.get_scheme_by_id(db, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")
    return scheme
