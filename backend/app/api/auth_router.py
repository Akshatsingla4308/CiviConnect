import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBUser, DBUserProfileRecord
from app.models.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfileResponse
from app.services.auth_service import AuthService, get_current_user

logger = logging.getLogger("civiconnect.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(DBUser).filter(DBUser.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    pw_hash = AuthService.hash_password(req.password)
    user = DBUser(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        password_hash=pw_hash,
        role="citizen",
        preferred_language=req.preferred_language or "en",
        account_status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty profile record
    profile = DBUserProfileRecord(
        user_id=user.id,
        preferred_language=user.preferred_language
    )
    db.add(profile)
    db.commit()

    token = AuthService.create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        preferred_language=user.preferred_language
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == req.email.lower().strip()).first()
    if not user or not AuthService.verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended or deactivated."
        )

    token = AuthService.create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        preferred_language=user.preferred_language
    )


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
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
