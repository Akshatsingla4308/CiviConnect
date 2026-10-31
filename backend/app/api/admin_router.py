import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.database import get_db, get_database_status
from app.models.db_models import (
    DBUser,
    DBScheme,
    DBDocument,
    DBSchemeRule,
    DBSchemeDocument,
    DBSchemeSource,
    DBAdminAuditLog
)
from app.services.auth_service import require_admin
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/api/admin", tags=["Administration"])


@router.get("/stats")
def get_admin_stats(
    admin: DBUser = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_schemes = db.query(DBScheme).count()
    verified_schemes = db.query(DBScheme).filter_by(verification_status="verified").count()
    pending_schemes = db.query(DBScheme).filter(DBScheme.verification_status != "verified").count()
    
    total_documents = db.query(DBDocument).count()
    total_rules = db.query(DBSchemeRule).count()
    total_users = db.query(DBUser).count()
    total_sources = db.query(DBSchemeSource).count()

    # Category breakdown
    categories = db.query(DBScheme.category).all()
    cat_counts = {}
    for c in categories:
        cat_counts[c[0]] = cat_counts.get(c[0], 0) + 1

    # Level breakdown
    levels = db.query(DBScheme.level).all()
    level_counts = {}
    for l in levels:
        level_counts[l[0]] = level_counts.get(l[0], 0) + 1

    return {
        "overview": {
            "total_schemes": total_schemes,
            "verified_schemes": verified_schemes,
            "pending_schemes": pending_schemes,
            "total_documents": total_documents,
            "total_rules": total_rules,
            "total_sources": total_sources,
            "total_users": total_users,
        },
        "category_breakdown": cat_counts,
        "level_breakdown": level_counts,
        "database_status": get_database_status()
    }


@router.get("/audit-logs")
def get_audit_logs(
    admin: DBUser = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(DBAdminAuditLog).order_by(DBAdminAuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "admin_email": l.admin_email,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "change_summary": l.change_summary,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in logs
    ]


@router.put("/schemes/{scheme_id}/verification")
def toggle_scheme_verification(
    scheme_id: str,
    status: str = Body(..., embed=True),
    admin: DBUser = Depends(require_admin),
    db: Session = Depends(get_db)
):
    valid_statuses = ["verified", "partially_verified", "unverified"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    updated = SchemeService.update_verification_status(db, scheme_id, status, admin.email)
    if not updated:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return updated
