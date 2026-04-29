"""shared_image_prompt_pool

Revision ID: 6b9d1c3f2a11
Revises: a40fbadecb58
Create Date: 2026-04-29 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6b9d1c3f2a11"
down_revision: str | None = "a40fbadecb58"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


STANDARD_PROMPT = "Describe what you see in this image"


def upgrade() -> None:
    op.add_column(
        "sentence_corpus",
        sa.Column("image_prompt_url", sa.Text(), nullable=True),
    )

    op.alter_column(
        "sentence_corpus",
        "language_id",
        existing_type=sa.String(length=36),
        nullable=True,
        existing_nullable=False,
    )

    conn = op.get_bind()

    # Backfill URLs from the previous pipe-delimited storage format.
    conn.execute(
        sa.text(
            """
            UPDATE sentence_corpus
            SET image_prompt_url = split_part(sentence_text, '|', 2),
                sentence_text = split_part(sentence_text, '|', 1)
            WHERE source_type = 'image_prompt'
              AND image_prompt_url IS NULL
              AND sentence_text LIKE '%|%'
            """
        )
    )

    # Remove broken image-prompt rows that never had a URL.
    conn.execute(
        sa.text(
            """
            DELETE FROM sentence_corpus
            WHERE source_type = 'image_prompt'
              AND (image_prompt_url IS NULL OR image_prompt_url = '')
            """
        )
    )

    # Collapse duplicate URLs so only one shared row remains per image.
    conn.execute(
        sa.text(
            """
            WITH ranked AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY image_prompt_url
                        ORDER BY created_at ASC, id ASC
                    ) AS rn
                FROM sentence_corpus
                WHERE source_type = 'image_prompt'
                  AND image_prompt_url IS NOT NULL
            )
            DELETE FROM sentence_corpus
            USING ranked
            WHERE sentence_corpus.id = ranked.id
              AND ranked.rn > 1
            """
        )
    )

    # Normalize the remaining shared image-prompt rows.
    conn.execute(
        sa.text(
            """
            UPDATE sentence_corpus
            SET language_id = NULL,
                sentence_text = :standard_prompt
            WHERE source_type = 'image_prompt'
            """
        ),
        {"standard_prompt": STANDARD_PROMPT},
    )

    op.create_index(
        "ix_sentence_corpus_image_prompt_url",
        "sentence_corpus",
        ["image_prompt_url"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_sentence_corpus_image_prompt_url", table_name="sentence_corpus")
    op.drop_column("sentence_corpus", "image_prompt_url")

    op.alter_column(
        "sentence_corpus",
        "language_id",
        existing_type=sa.String(length=36),
        nullable=False,
        existing_nullable=True,
    )
