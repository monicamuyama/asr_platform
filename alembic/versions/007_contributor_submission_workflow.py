"""Add contributor submission workflow with transcription and translation support.

Revision ID: 007
Revises: 006
Create Date: 2026-04-11 12:00:00.000000

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add contributor_transcription column to submissions table
    op.add_column(
        "submissions",
        sa.Column("contributor_transcription", sa.Text(), nullable=True),
    )

    # Create contributor_translations table
    op.create_table(
        "contributor_translations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("submission_id", sa.String(36), nullable=False),
        sa.Column("source_language_code", sa.String(20), nullable=False),
        sa.Column("target_language_code", sa.String(20), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("translator_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="submitted"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contributor_translations_submission_id", "contributor_translations", ["submission_id"])
    op.create_index("ix_contributor_translations_translator_id", "contributor_translations", ["translator_id"])
    op.create_index("ix_contributor_translations_status", "contributor_translations", ["status"])


def downgrade() -> None:
    op.drop_index("ix_contributor_translations_status", table_name="contributor_translations")
    op.drop_index("ix_contributor_translations_translator_id", table_name="contributor_translations")
    op.drop_index("ix_contributor_translations_submission_id", table_name="contributor_translations")
    op.drop_table("contributor_translations")
    op.drop_column("submissions", "contributor_transcription")
