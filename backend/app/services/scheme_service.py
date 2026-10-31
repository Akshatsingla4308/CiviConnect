import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.db_models import DBScheme, DBSchemeRule, DBDocument, DBSchemeDocument, DBSchemeSource, DBAdminAuditLog
from app.models.schemas import SchemeCreateRequest, SchemeResponse

logger = logging.getLogger("civiconnect.scheme_service")


class SchemeService:
    @staticmethod
    def get_all_schemes(
        db: Session,
        category: Optional[str] = None,
        state: Optional[str] = None,
        level: Optional[str] = None,
        search: Optional[str] = None,
        verification_status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = db.query(DBScheme)

        if category and category.lower() != "all":
            query = query.filter(DBScheme.category == category.lower())

        if level and level.lower() != "all":
            query = query.filter(DBScheme.level == level.lower())

        if verification_status and verification_status.lower() != "all":
            query = query.filter(DBScheme.verification_status == verification_status.lower())

        if state and state.lower() != "all":
            query = query.filter(or_(
                DBScheme.applicable_states.like("%ALL%"),
                DBScheme.applicable_states.ilike(f"%{state}%")
            ))

        if search and search.strip():
            kw = f"%{search.strip()}%"
            query = query.filter(or_(
                DBScheme.name.ilike(kw),
                DBScheme.name_hi.ilike(kw),
                DBScheme.name_pa.ilike(kw),
                DBScheme.short_description.ilike(kw),
                DBScheme.category.ilike(kw),
                DBScheme.department.ilike(kw)
            ))

        schemes = query.offset(offset).limit(limit).all()
        return [SchemeService.format_scheme(s) for s in schemes]

    @staticmethod
    def get_scheme_by_id(db: Session, scheme_id: str) -> Optional[Dict[str, Any]]:
        scheme = db.query(DBScheme).filter(DBScheme.id == scheme_id).first()
        if not scheme:
            return None
        return SchemeService.format_scheme(scheme, include_details=True)

    @staticmethod
    def format_scheme(s: DBScheme, include_details: bool = False) -> Dict[str, Any]:
        def safe_json(val, default):
            if not val:
                return default
            try:
                return json.loads(val)
            except Exception:
                return default

        data = {
            "id": s.id,
            "name": s.name,
            "name_hi": s.name_hi,
            "name_pa": s.name_pa,
            "short_description": s.short_description,
            "detailed_description": s.detailed_description,
            "level": s.level,
            "department": s.department,
            "applicable_states": safe_json(s.applicable_states, ["ALL"]),
            "category": s.category,
            "subcategories": safe_json(s.subcategories_json, []),
            "target_beneficiaries": safe_json(s.target_beneficiaries_json, []),
            "benefits_summary": s.benefits_summary,
            "benefits": safe_json(s.benefits_json, []),
            "eligibility_summary": s.eligibility_summary,
            "exclusions": safe_json(s.exclusions_json, []),
            "application_process": s.application_process,
            "official_portal_url": s.official_portal_url,
            "official_source_url": s.official_source_url,
            "helpline_number": s.helpline_number,
            "status": s.status,
            "verification_status": s.verification_status,
            "last_verified_date": s.last_verified_date,
            "rules_count": len(s.rules),
            "documents_count": len(s.documents),
            "sources_count": len(s.sources),
        }

        if include_details:
            data["rules"] = [
                {
                    "id": r.id,
                    "criterion_type": r.criterion_type,
                    "field_name": r.field_name,
                    "operator": r.operator,
                    "expected_value": safe_json(r.expected_value_json, r.expected_value_json),
                    "is_mandatory": r.is_mandatory,
                    "description": r.description,
                    "source_reference": r.source_reference,
                    "verification_status": r.verification_status
                }
                for r in s.rules
            ]

            data["documents"] = [
                {
                    "id": d.id,
                    "document_id": d.document_id,
                    "name": d.document.name if d.document else d.document_id,
                    "name_hi": d.document.name_hi if d.document else None,
                    "name_pa": d.document.name_pa if d.document else None,
                    "category": d.document.category if d.document else "general",
                    "requirement_type": d.requirement_type,
                    "condition_description": d.condition_description,
                    "preparation_instructions": d.preparation_instructions,
                    "official_portal_url": d.document.official_portal_url if d.document else None
                }
                for d in s.documents
            ]

            data["sources"] = [
                {
                    "id": src.id,
                    "title": src.source_title,
                    "url": src.source_url,
                    "publisher": src.publisher,
                    "source_type": src.source_type,
                    "last_verified": src.last_verified,
                    "verification_status": src.verification_status
                }
                for src in s.sources
            ]

        return data

    @staticmethod
    def update_verification_status(db: Session, scheme_id: str, new_status: str, admin_email: str) -> Optional[Dict[str, Any]]:
        scheme = db.query(DBScheme).filter(DBScheme.id == scheme_id).first()
        if not scheme:
            return None
        old_status = scheme.verification_status
        scheme.verification_status = new_status
        
        # Log audit
        audit = DBAdminAuditLog(
            admin_id="admin",
            admin_email=admin_email,
            action="UPDATE_VERIFICATION_STATUS",
            target_type="scheme",
            target_id=scheme_id,
            change_summary=f"Changed verification status from {old_status} to {new_status}"
        )
        db.add(audit)
        db.commit()
        db.refresh(scheme)
        return SchemeService.format_scheme(scheme, include_details=True)
