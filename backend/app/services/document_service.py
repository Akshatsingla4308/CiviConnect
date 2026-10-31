import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import DBDocument, DBSchemeDocument

logger = logging.getLogger("civiconnect.document_service")


class DocumentService:
    @staticmethod
    def get_all_documents(
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(DBDocument)

        if category and category.lower() != "all":
            query = query.filter(DBDocument.category == category.lower())

        if search and search.strip():
            kw = f"%{search.strip()}%"
            query = query.filter(
                (DBDocument.name.ilike(kw)) |
                (DBDocument.name_hi.ilike(kw)) |
                (DBDocument.name_pa.ilike(kw)) |
                (DBDocument.description.ilike(kw)) |
                (DBDocument.issuing_authority.ilike(kw))
            )

        docs = query.all()
        result = []
        for d in docs:
            schemes_mapped = [
                {
                    "scheme_id": sd.scheme_id,
                    "scheme_name": sd.scheme.name if sd.scheme else sd.scheme_id,
                    "requirement_type": sd.requirement_type
                }
                for sd in d.schemes
            ]
            result.append({
                "id": d.id,
                "name": d.name,
                "name_hi": d.name_hi,
                "name_pa": d.name_pa,
                "description": d.description,
                "category": d.category,
                "issuing_authority": d.issuing_authority,
                "general_guidance": d.general_guidance,
                "official_portal_url": d.official_portal_url,
                "associated_schemes_count": len(schemes_mapped),
                "associated_schemes": schemes_mapped
            })
        return result

    @staticmethod
    def get_document_by_id(db: Session, doc_id: str) -> Optional[Dict[str, Any]]:
        d = db.query(DBDocument).filter(DBDocument.id == doc_id).first()
        if not d:
            return None
        schemes_mapped = [
            {
                "scheme_id": sd.scheme_id,
                "scheme_name": sd.scheme.name if sd.scheme else sd.scheme_id,
                "requirement_type": sd.requirement_type,
                "instructions": sd.preparation_instructions
            }
            for sd in d.schemes
        ]
        return {
            "id": d.id,
            "name": d.name,
            "name_hi": d.name_hi,
            "name_pa": d.name_pa,
            "description": d.description,
            "category": d.category,
            "issuing_authority": d.issuing_authority,
            "general_guidance": d.general_guidance,
            "official_portal_url": d.official_portal_url,
            "associated_schemes_count": len(schemes_mapped),
            "associated_schemes": schemes_mapped
        }
