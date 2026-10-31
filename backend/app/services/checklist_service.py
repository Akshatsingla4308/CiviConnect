import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import DBUserChecklist, DBScheme, DBSchemeDocument
from app.models.schemas import ChecklistItem, ChecklistResponse

logger = logging.getLogger("civiconnect.checklist_service")


class ChecklistService:
    @staticmethod
    def get_or_create_checklist(db: Session, user_id: str, scheme_id: str) -> Dict[str, Any]:
        checklist = db.query(DBUserChecklist).filter_by(user_id=user_id, scheme_id=scheme_id).first()
        scheme = db.query(DBScheme).filter_by(id=scheme_id).first()
        
        if not scheme:
            raise ValueError(f"Scheme '{scheme_id}' not found.")

        if not checklist:
            # Build default items from scheme_documents
            items = []
            for sd in scheme.documents:
                doc = sd.document
                items.append({
                    "doc_id": sd.document_id,
                    "name": doc.name if doc else sd.document_id,
                    "category": doc.category if doc else "general",
                    "requirement_type": sd.requirement_type,
                    "instructions": sd.preparation_instructions or (doc.general_guidance if doc else None),
                    "is_ready": False,
                    "notes": ""
                })

            checklist = DBUserChecklist(
                user_id=user_id,
                scheme_id=scheme_id,
                status="in_progress",
                items_json=json.dumps(items, ensure_ascii=False),
                completion_percentage=0
            )
            db.add(checklist)
            db.commit()
            db.refresh(checklist)

        return ChecklistService._format_checklist(checklist, scheme.name)

    @staticmethod
    def update_checklist_items(
        db: Session,
        user_id: str,
        scheme_id: str,
        items: List[ChecklistItem],
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        checklist = db.query(DBUserChecklist).filter_by(user_id=user_id, scheme_id=scheme_id).first()
        scheme = db.query(DBScheme).filter_by(id=scheme_id).first()

        if not scheme:
            raise ValueError(f"Scheme '{scheme_id}' not found.")

        if not checklist:
            checklist = DBUserChecklist(
                user_id=user_id,
                scheme_id=scheme_id,
                status="in_progress",
                items_json="[]",
                completion_percentage=0
            )
            db.add(checklist)

        # Calculate completion percentage
        total_mandatory = sum(1 for item in items if item.requirement_type == "mandatory")
        ready_mandatory = sum(1 for item in items if item.requirement_type == "mandatory" and item.is_ready)
        
        if total_mandatory > 0:
            pct = int((ready_mandatory / total_mandatory) * 100)
        else:
            total_all = len(items)
            ready_all = sum(1 for item in items if item.is_ready)
            pct = int((ready_all / total_all) * 100) if total_all > 0 else 100

        calculated_status = status or ("completed" if pct == 100 else "in_progress")

        items_dict = [item.model_dump() for item in items]
        checklist.items_json = json.dumps(items_dict, ensure_ascii=False)
        checklist.completion_percentage = pct
        checklist.status = calculated_status

        db.commit()
        db.refresh(checklist)
        return ChecklistService._format_checklist(checklist, scheme.name)

    @staticmethod
    def get_user_checklists(db: Session, user_id: str) -> List[Dict[str, Any]]:
        records = db.query(DBUserChecklist).filter_by(user_id=user_id).all()
        result = []
        for r in records:
            scheme = db.query(DBScheme).filter_by(id=r.scheme_id).first()
            s_name = scheme.name if scheme else r.scheme_id
            result.append(ChecklistService._format_checklist(r, s_name))
        return result

    @staticmethod
    def _format_checklist(checklist: DBUserChecklist, scheme_name: str) -> Dict[str, Any]:
        try:
            items_raw = json.loads(checklist.items_json)
        except Exception:
            items_raw = []

        return {
            "id": checklist.id,
            "user_id": checklist.user_id,
            "scheme_id": checklist.scheme_id,
            "scheme_name": scheme_name,
            "status": checklist.status,
            "items": items_raw,
            "completion_percentage": checklist.completion_percentage,
            "created_at": checklist.created_at.isoformat() if checklist.created_at else None,
            "updated_at": checklist.updated_at.isoformat() if checklist.updated_at else None,
        }
