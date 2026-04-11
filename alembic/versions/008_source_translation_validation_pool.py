"""Add source translation validation pool table

Revision ID: 008
Revises: 007
Create Date: 2026-04-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: str | tuple[str, ...] | None = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "source_translation_validations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_translation_task_id", sa.String(length=36), nullable=False),
        sa.Column("validator_id", sa.String(length=36), nullable=False),
        sa.Column("is_valid", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_translation_task_id"], ["source_translation_tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_translation_task_id",
            "validator_id",
            name="uq_source_translation_validation_task_validator",
        ),
    )
    op.create_index(
        "ix_source_translation_validations_source_translation_task_id",
        "source_translation_validations",
        ["source_translation_task_id"],
    )
    op.create_index(
        "ix_source_translation_validations_validator_id",
        "source_translation_validations",
        ["validator_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_source_translation_validations_validator_id", table_name="source_translation_validations")
    op.drop_index(
        "ix_source_translation_validations_source_translation_task_id",
        table_name="source_translation_validations",
    )
    op.drop_table("source_translation_validations")
