from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBUser
from app.models.schemas import ChecklistUpdateRequest, ChecklistResponse
from app.services.auth_service import get_current_user
from app.services.checklist_service import ChecklistService

router = APIRouter(prefix="/api/checklists", tags=["Checklists"])


@router.get("")
def get_user_checklists(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ChecklistService.get_user_checklists(db, current_user.id)


@router.get("/{scheme_id}")
def get_or_create_scheme_checklist(
    scheme_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ChecklistService.get_or_create_checklist(db, current_user.id, scheme_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{scheme_id}")
def update_scheme_checklist(
    scheme_id: str,
    req: ChecklistUpdateRequest,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return ChecklistService.update_checklist_items(
            db=db,
            user_id=current_user.id,
            scheme_id=scheme_id,
            items=req.items,
            status=req.status
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
