from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.assistant_service import assistant_service
from app.services.auth_service import get_optional_current_user
from app.models.db_models import DBUser

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatMessageResponse)
def assistant_chat(
    req: ChatMessageRequest,
    current_user: DBUser = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    profile = req.user_profile
    if not profile and current_user and current_user.profile:
        p = current_user.profile
        profile = {
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
            "is_bpl": p.is_bpl,
        }

    user_id = current_user.id if current_user else None
    return assistant_service.chat(
        db=db,
        message=req.message,
        session_id=req.session_id,
        language=req.language or "en",
        user_profile=profile,
        user_id=user_id
    )


@router.get("/status")
def get_ai_status():
    return assistant_service.get_provider_status()
