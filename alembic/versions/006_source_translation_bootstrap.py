"""Add source corpus pairing and multilingual translation bootstrap tables

Revision ID: 006
Revises: 005
Create Date: 2026-04-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: str | tuple[str, ...] | None = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "source_sentence_pairs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_sentence_id", sa.String(length=36), nullable=False),
        sa.Column("target_sentence_id", sa.String(length=36), nullable=False),
        sa.Column("source_language_id", sa.String(length=36), nullable=False),
        sa.Column("target_language_id", sa.String(length=36), nullable=False),
        sa.Column("source_dataset", sa.String(length=100), nullable=False),
        sa.Column("source_row_number", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_sentence_id"], ["sentence_corpus.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_sentence_id"], ["sentence_corpus.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_language_id"], ["languages.id"]),
        sa.ForeignKeyConstraint(["target_language_id"], ["languages.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_sentence_id",
            "target_sentence_id",
            name="uq_source_sentence_pair_unique",
        ),
    )
    op.create_index("ix_source_sentence_pairs_source_sentence_id", "source_sentence_pairs", ["source_sentence_id"])
    op.create_index("ix_source_sentence_pairs_target_sentence_id", "source_sentence_pairs", ["target_sentence_id"])
    op.create_index("ix_source_sentence_pairs_source_language_id", "source_sentence_pairs", ["source_language_id"])
    op.create_index("ix_source_sentence_pairs_target_language_id", "source_sentence_pairs", ["target_language_id"])

    op.create_table(
        "source_translation_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_sentence_id", sa.String(length=36), nullable=False),
        sa.Column("source_language_id", sa.String(length=36), nullable=False),
        sa.Column("target_language_id", sa.String(length=36), nullable=False),
        sa.Column("translator_id", sa.String(length=36), nullable=True),
        sa.Column("machine_prefill_text", sa.Text(), nullable=True),
        sa.Column("prefill_provider", sa.String(length=100), nullable=True),
        sa.Column("prefill_confidence", sa.Float(), nullable=True),
        sa.Column("translated_text", sa.Text(), nullable=True),
        sa.Column("reviewed_text", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.String(length=36), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["source_sentence_id"], ["sentence_corpus.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_language_id"], ["languages.id"]),
        sa.ForeignKeyConstraint(["target_language_id"], ["languages.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_sentence_id",
            "target_language_id",
            name="uq_source_translation_task_unique",
        ),
    )
    op.create_index("ix_source_translation_tasks_source_sentence_id", "source_translation_tasks", ["source_sentence_id"])
    op.create_index("ix_source_translation_tasks_source_language_id", "source_translation_tasks", ["source_language_id"])
    op.create_index("ix_source_translation_tasks_target_language_id", "source_translation_tasks", ["target_language_id"])
    op.create_index("ix_source_translation_tasks_translator_id", "source_translation_tasks", ["translator_id"])
    op.create_index("ix_source_translation_tasks_status", "source_translation_tasks", ["status"])


def downgrade() -> None:
    op.drop_index("ix_source_translation_tasks_status", table_name="source_translation_tasks")
    op.drop_index("ix_source_translation_tasks_translator_id", table_name="source_translation_tasks")
    op.drop_index("ix_source_translation_tasks_target_language_id", table_name="source_translation_tasks")
    op.drop_index("ix_source_translation_tasks_source_language_id", table_name="source_translation_tasks")
    op.drop_index("ix_source_translation_tasks_source_sentence_id", table_name="source_translation_tasks")
    op.drop_table("source_translation_tasks")

    op.drop_index("ix_source_sentence_pairs_target_language_id", table_name="source_sentence_pairs")
    op.drop_index("ix_source_sentence_pairs_source_language_id", table_name="source_sentence_pairs")
    op.drop_index("ix_source_sentence_pairs_target_sentence_id", table_name="source_sentence_pairs")
    op.drop_index("ix_source_sentence_pairs_source_sentence_id", table_name="source_sentence_pairs")
    op.drop_table("source_sentence_pairs")
