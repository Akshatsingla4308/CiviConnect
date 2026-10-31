import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import (
    DBUser,
    DBUserProfileRecord,
    DBSavedScheme,
    DBUserAssessment,
    DBUserApplication,
    DBScheme
)
from app.models.schemas import UserProfileUpdate, UserProfileResponse
from app.services.auth_service import get_current_user
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/api/user", tags=["User Workspace"])


# ==============================================================================
# PROFILE MANAGEMENT
# ==============================================================================

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    p = current_user.profile
    profile_dict = None
    if p:
        profile_dict = {
            "state": p.state,
            "district": p.district,
            "age": p.age,
            "gender": p.gender,
            "education_level": p.education_level,
            "course": p.course,
            "occupation": p.occupation,
            "annual_household_income": p.annual_household_income,
            "social_category": p.social_category,
            "owns_cultivable_land": p.owns_cultivable_land,
            "is_taxpayer": p.is_taxpayer,
            "is_bpl": p.is_bpl,
            "disability_status": p.disability_status,
            "marital_status": p.marital_status,
            "preferred_language": p.preferred_language,
        }
    return UserProfileResponse(
        user_id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        preferred_language=current_user.preferred_language,
        is_profile_complete=current_user.is_profile_complete,
        profile=profile_dict
    )


@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    req: UserProfileUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = DBUserProfileRecord(user_id=current_user.id)
        db.add(profile)

    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    # Check completeness
    required_fields = [profile.state, profile.age, profile.annual_household_income, profile.social_category]
    current_user.is_profile_complete = all(f is not None for f in required_fields)
    if req.preferred_language:
        current_user.preferred_language = req.preferred_language

    db.commit()
    db.refresh(current_user)
    db.refresh(profile)

    return get_user_profile(current_user, db)


# ==============================================================================
# SAVED SCHEMES
# ==============================================================================

@router.get("/saved-schemes")
def get_saved_schemes(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = db.query(DBSavedScheme).filter_by(user_id=current_user.id).all()
    results = []
    for s in saved:
        scheme_data = SchemeService.format_scheme(s.scheme) if s.scheme else None
        results.append({
            "id": s.id,
            "scheme_id": s.scheme_id,
            "saved_at": s.saved_at.isoformat() if s.saved_at else None,
            "notes": s.notes,
            "scheme": scheme_data
        })
    return results


@router.post("/saved-schemes/{scheme_id}")
def save_scheme(
    scheme_id: str,
    notes: Optional[str] = None,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(DBScheme).filter_by(id=scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    existing = db.query(DBSavedScheme).filter_by(user_id=current_user.id, scheme_id=scheme_id).first()
    if existing:
        existing.notes = notes
        db.commit()
        return {"status": "already_saved", "message": "Scheme is already in your saved list."}

    saved = DBSavedScheme(
        user_id=current_user.id,
        scheme_id=scheme_id,
        notes=notes
    )
    db.add(saved)
    db.commit()
    return {"status": "saved", "message": "Scheme added to saved list."}


@router.delete("/saved-schemes/{scheme_id}")
def remove_saved_scheme(
    scheme_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(DBSavedScheme).filter_by(user_id=current_user.id, scheme_id=scheme_id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Scheme not found in saved list.")
    db.delete(saved)
    db.commit()
    return {"status": "removed", "message": "Scheme removed from saved list."}


# ==============================================================================
# ASSESSMENT HISTORY
# ==============================================================================

@router.get("/assessments")
def get_user_assessments(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    assessments = db.query(DBUserAssessment).filter_by(user_id=current_user.id).order_by(DBUserAssessment.assessed_at.desc()).limit(20).all()
    results = []
    for a in assessments:
        scheme = db.query(DBScheme).filter_by(id=a.scheme_id).first()
        results.append({
            "id": a.id,
            "scheme_id": a.scheme_id,
            "scheme_name": scheme.name if scheme else a.scheme_id,
            "verdict": a.verdict,
            "criteria_evaluated": json.loads(a.criteria_evaluated_json or "[]"),
            "passed_criteria": json.loads(a.passed_criteria_json or "[]"),
            "failed_criteria": json.loads(a.failed_criteria_json or "[]"),
            "unknown_criteria": json.loads(a.unknown_criteria_json or "[]"),
            "assessed_at": a.assessed_at.isoformat() if a.assessed_at else None
        })
    return results


@router.post("/assessments")
def record_assessment(
    assessment_data: Dict[str, Any],
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme_id = assessment_data.get("scheme_id")
    if not scheme_id:
        raise HTTPException(status_code=400, detail="scheme_id required.")

    rec = DBUserAssessment(
        user_id=current_user.id,
        scheme_id=scheme_id,
        verdict=assessment_data.get("verdict", "unknown"),
        criteria_evaluated_json=json.dumps(assessment_data.get("checks", []), ensure_ascii=False),
        passed_criteria_json=json.dumps([c["field"] for c in assessment_data.get("checks", []) if c.get("status") == "pass"], ensure_ascii=False),
        failed_criteria_json=json.dumps([c["field"] for c in assessment_data.get("checks", []) if c.get("status") == "fail"], ensure_ascii=False),
        unknown_criteria_json=json.dumps(assessment_data.get("missing_fields", []), ensure_ascii=False)
    )
    db.add(rec)
    db.commit()
    return {"status": "recorded", "id": rec.id}


# ==============================================================================
# APPLICATIONS TRACKER
# ==============================================================================

@router.get("/applications")
def get_user_applications(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = db.query(DBUserApplication).filter_by(user_id=current_user.id).order_by(DBUserApplication.updated_at.desc()).all()
    return [
        {
            "id": a.id,
            "scheme_id": a.scheme_id,
            "scheme_name": a.scheme_name,
            "application_number": a.application_number,
            "status": a.status,
            "submission_date": a.submission_date,
            "department": a.department,
            "portal_url": a.portal_url,
            "notes": a.notes,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in apps
    ]


@router.post("/applications")
def create_application_tracker(
    data: Dict[str, Any],
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scheme_id = data.get("scheme_id")
    scheme = db.query(DBScheme).filter_by(id=scheme_id).first()
    scheme_name = scheme.name if scheme else data.get("scheme_name", scheme_id)

    app_rec = DBUserApplication(
        user_id=current_user.id,
        scheme_id=scheme_id,
        scheme_name=scheme_name,
        application_number=data.get("application_number"),
        status=data.get("status", "documents_pending"),
        submission_date=data.get("submission_date"),
        department=scheme.department if scheme else data.get("department"),
        portal_url=scheme.official_portal_url if scheme else data.get("portal_url"),
        notes=data.get("notes")
    )
    db.add(app_rec)
    db.commit()
    db.refresh(app_rec)
    return {"status": "created", "id": app_rec.id}
