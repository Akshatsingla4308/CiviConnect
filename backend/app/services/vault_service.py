import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.db_models import DBUser, DBUserVaultDocument

logger = logging.getLogger("civiconnect.vault")

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Vault directory base (securely stored outside public web directory)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
VAULT_STORAGE_BASE = PROJECT_ROOT / "uploads" / "vault"


class VaultService:
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        # Keep only safe alphanumeric, dots, dashes, underscores
        clean = re.sub(r"[^A-Za-z0-9_.-]", "_", filename)
        return clean.strip("._") or "document.bin"

    @classmethod
    def save_document(
        cls,
        db: Session,
        user: DBUser,
        file: UploadFile,
        document_name: str,
        document_type: str = "general",
        notes: Optional[str] = None
    ) -> DBUserVaultDocument:
        # 1. Validate MIME type
        content_type = (file.content_type or "").lower().strip()
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{content_type}'. Only PDF, JPEG, and PNG files are accepted."
            )

        # 2. Read content & check size limit
        try:
            content = file.file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read uploaded file: {str(e)}"
            )

        file_size = len(content)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowable limit of 10 MB (File size: {file_size / (1024*1024):.1f} MB)."
            )
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded."
            )

        # 3. Compute SHA-256 Checksum
        sha256 = hashlib.sha256(content).hexdigest()

        # 4. Prepare User Vault Directory
        user_vault_dir = VAULT_STORAGE_BASE / str(user.id)
        user_vault_dir.mkdir(parents=True, exist_ok=True)

        safe_name = cls._sanitize_filename(file.filename or "uploaded_doc")
        storage_filename = f"{sha256[:16]}_{safe_name}"
        dest_path = user_vault_dir / storage_filename

        # Write securely
        with open(dest_path, "wb") as f:
            f.write(content)

        # 5. Record in Database
        vault_record = DBUserVaultDocument(
            user_id=user.id,
            document_name=document_name.strip(),
            document_type=document_type.strip(),
            file_name=safe_name,
            file_size_bytes=file_size,
            mime_type=content_type,
            storage_path=str(dest_path),
            sha256_checksum=sha256,
            notes=notes.strip() if notes else None
        )
        db.add(vault_record)
        db.commit()
        db.refresh(vault_record)
        logger.info(f"Vault document '{vault_record.id}' saved for user '{user.id}'.")
        return vault_record

    @classmethod
    def list_documents(cls, db: Session, user: DBUser) -> List[DBUserVaultDocument]:
        return (
            db.query(DBUserVaultDocument)
            .filter(DBUserVaultDocument.user_id == user.id)
            .order_by(DBUserVaultDocument.created_at.desc())
            .all()
        )

    @classmethod
    def get_document(cls, db: Session, user: DBUser, doc_id: str) -> DBUserVaultDocument:
        doc = (
            db.query(DBUserVaultDocument)
            .filter(DBUserVaultDocument.id == doc_id, DBUserVaultDocument.user_id == user.id)
            .first()
        )
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vault document not found or you do not have permission to access it."
            )
        return doc

    @classmethod
    def delete_document(cls, db: Session, user: DBUser, doc_id: str) -> bool:
        doc = cls.get_document(db, user, doc_id)
        # Delete on disk if present
        if doc.storage_path and os.path.exists(doc.storage_path):
            try:
                os.remove(doc.storage_path)
            except Exception as e:
                logger.warning(f"Failed to delete file from disk: {e}")
        db.delete(doc)
        db.commit()
        logger.info(f"Vault document '{doc_id}' deleted by owner '{user.id}'.")
        return True
