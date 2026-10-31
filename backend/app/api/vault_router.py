import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import DBUser
from app.models.schemas import VaultDocumentListResponse, VaultDocumentResponse
from app.services.auth_service import get_current_user
from app.services.vault_service import VaultService

logger = logging.getLogger("civiconnect.api.vault")
router = APIRouter(prefix="/api/vault", tags=["Document Vault"])


def _format_vault_doc(doc) -> VaultDocumentResponse:
    return VaultDocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        document_name=doc.document_name,
        document_type=doc.document_type,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        sha256_checksum=doc.sha256_checksum,
        notes=doc.notes,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
        updated_at=doc.updated_at.isoformat() if doc.updated_at else ""
    )


@router.post("/upload", response_model=VaultDocumentResponse)
def upload_vault_document(
    file: UploadFile = File(...),
    document_name: str = Form(...),
    document_type: str = Form("general"),
    notes: Optional[str] = Form(None),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not document_name.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document name is required.")

    doc = VaultService.save_document(
        db=db,
        user=current_user,
        file=file,
        document_name=document_name,
        document_type=document_type,
        notes=notes
    )
    return _format_vault_doc(doc)


@router.get("", response_model=VaultDocumentListResponse)
def list_vault_documents(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = VaultService.list_documents(db, current_user)
    return VaultDocumentListResponse(
        total=len(docs),
        items=[_format_vault_doc(d) for d in docs]
    )


@router.get("/{doc_id}/download")
def download_vault_document(
    doc_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = VaultService.get_document(db, current_user, doc_id)
    return FileResponse(
        path=doc.storage_path,
        media_type=doc.mime_type,
        filename=doc.file_name
    )


@router.delete("/{doc_id}")
def delete_vault_document(
    doc_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    VaultService.delete_document(db, current_user, doc_id)
    return {"message": "Document deleted successfully from your private vault.", "id": doc_id}
