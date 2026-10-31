import datetime
import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBUser, DBUserApplication, utcnow
from app.models.schemas import ApplicationCreateRequest, ApplicationListResponse, ApplicationResponse, ApplicationUpdateRequest
from app.services.auth_service import get_current_user

logger = logging.getLogger("civiconnect.api.applications")
router = APIRouter(prefix="/api/applications", tags=["Application Tracker"])

VALID_STATUSES = {
    "Draft",
    "Submitted",
    "Under Scrutiny",
    "Approved",
    "Disbursed",
    "Rejected",
    "Action Required"
}


def _format_app_response(app: DBUserApplication) -> ApplicationResponse:
    try:
        history = json.loads(app.history_json or "[]")
    except Exception:
        history = []
    return ApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        scheme_id=app.scheme_id,
        scheme_name=app.scheme_name,
        application_number=app.application_number,
        status=app.status,
        submission_date=app.submission_date,
        department=app.department,
        portal_url=app.portal_url,
        notes=app.notes,
        history=history,
        created_at=app.created_at.isoformat() if app.created_at else "",
        updated_at=app.updated_at.isoformat() if app.updated_at else ""
    )


@router.post("", response_model=ApplicationResponse)
def create_application(
    req: ApplicationCreateRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{req.status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}."
        )

    initial_history = [{
        "status": req.status,
        "timestamp": utcnow().isoformat(),
        "note": "Application created in citizen tracker."
    }]

    app = DBUserApplication(
        user_id=current_user.id,
        scheme_id=req.scheme_id.strip(),
        scheme_name=req.scheme_name.strip(),
        application_number=req.application_number.strip() if req.application_number else None,
        status=req.status,
        submission_date=req.submission_date,
        department=req.department,
        portal_url=req.portal_url,
        notes=req.notes,
        history_json=json.dumps(initial_history, ensure_ascii=False)
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return _format_app_response(app)


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = (
        db.query(DBUserApplication)
        .filter(DBUserApplication.user_id == current_user.id)
        .order_by(DBUserApplication.created_at.desc())
        .all()
    )
    return ApplicationListResponse(
        total=len(apps),
        items=[_format_app_response(a) for a in apps]
    )


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = (
        db.query(DBUserApplication)
        .filter(DBUserApplication.id == app_id, DBUserApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found.")
    return _format_app_response(app)


@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: str,
    req: ApplicationUpdateRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = (
        db.query(DBUserApplication)
        .filter(DBUserApplication.id == app_id, DBUserApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found.")

    try:
        history = json.loads(app.history_json or "[]")
    except Exception:
        history = []

    status_changed = False
    if req.status and req.status != app.status:
        if req.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{req.status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}."
            )
        old_status = app.status
        app.status = req.status
        status_changed = True
        history.append({
            "status": req.status,
            "previous_status": old_status,
            "timestamp": utcnow().isoformat(),
            "note": req.status_note or f"Status changed from {old_status} to {req.status}."
        })

    if req.application_number is not None:
        app.application_number = req.application_number.strip()
    if req.submission_date is not None:
        app.submission_date = req.submission_date
    if req.department is not None:
        app.department = req.department
    if req.portal_url is not None:
        app.portal_url = req.portal_url
    if req.notes is not None:
        app.notes = req.notes

    if status_changed:
        app.history_json = json.dumps(history, ensure_ascii=False)

    db.commit()
    db.refresh(app)
    return _format_app_response(app)


@router.delete("/{app_id}")
def delete_application(
    app_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = (
        db.query(DBUserApplication)
        .filter(DBUserApplication.id == app_id, DBUserApplication.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found.")
    db.delete(app)
    db.commit()
    return {"message": "Application record deleted successfully.", "id": app_id}
