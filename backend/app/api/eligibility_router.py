from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBScheme, DBUser
from app.models.schemas import EligibilityCheckRequest, EligibilityAssessmentResult
from app.services.eligibility_engine import EligibilityEngine
from app.services.auth_service import get_optional_current_user

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility Engine"])


@router.post("/check", response_model=EligibilityAssessmentResult)
def check_single_scheme(
    req: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):
    if not req.scheme_id:
        raise HTTPException(status_code=400, detail="scheme_id is required for single scheme assessment.")
    scheme = db.query(DBScheme).filter(DBScheme.id == req.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{req.scheme_id}' not found.")
    
    return EligibilityEngine.assess_scheme(scheme, req.profile)


@router.post("/evaluate-all")
def evaluate_all(
    req: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):
    results = EligibilityEngine.evaluate_all_schemes(
        db=db,
        profile=req.profile,
        category=req.profile.get("category"),
        limit=50
    )

    # Breakdown counts
    likely = [r for r in results if r.verdict == "likely_eligible"]
    possible = [r for r in results if r.verdict == "possibly_eligible"]
    insufficient = [r for r in results if r.verdict == "insufficient_information"]
    not_eligible = [r for r in results if r.verdict == "not_eligible_based_on_known_rules"]

    return {
        "total_evaluated": len(results),
        "likely_eligible_count": len(likely),
        "possibly_eligible_count": len(possible),
        "insufficient_information_count": len(insufficient),
        "not_eligible_count": len(not_eligible),
        "results": results
    }
