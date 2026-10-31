"""002_vault_and_applications

Revision ID: 002_vault_and_applications
Revises: 001_initial_schema
Create Date: 2026-11-01 04:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = '002_vault_and_applications'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()

    # 1. Create user_vault_documents if not present
    if "user_vault_documents" not in tables:
        op.create_table(
            "user_vault_documents",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("document_name", sa.String(length=255), nullable=False),
            sa.Column("document_type", sa.String(length=64), server_default="general", nullable=False),
            sa.Column("file_name", sa.String(length=255), nullable=False),
            sa.Column("file_size_bytes", sa.Integer(), nullable=False),
            sa.Column("mime_type", sa.String(length=64), nullable=False),
            sa.Column("storage_path", sa.String(length=512), nullable=False),
            sa.Column("sha256_checksum", sa.String(length=64), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )

    # 2. Add history_json column to user_applications if not present
    if "user_applications" in tables:
        columns = [c["name"] for c in inspector.get_columns("user_applications")]
        if "history_json" not in columns:
            op.add_column(
                "user_applications",
                sa.Column("history_json", sa.Text(), server_default="[]", nullable=False)
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    tables = inspector.get_table_names()

    if "user_vault_documents" in tables:
        op.drop_table("user_vault_documents")

    if "user_applications" in tables:
        columns = [c["name"] for c in inspector.get_columns("user_applications")]
        if "history_json" in columns:
            op.drop_column("user_applications", "history_json")
