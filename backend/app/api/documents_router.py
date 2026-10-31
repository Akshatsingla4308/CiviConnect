from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("")
def list_documents(
    category: Optional[str] = Query(None, description="Filter by document category"),
    search: Optional[str] = Query(None, description="Search document name or authority"),
    db: Session = Depends(get_db)
):
    docs = DocumentService.get_all_documents(db=db, category=category, search=search)
    return {
        "count": len(docs),
        "items": docs
    }


@router.get("/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = DocumentService.get_document_by_id(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    return doc
