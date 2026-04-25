"""Add users and collection-mode fields

Revision ID: 002_users
Revises: 002_complete
Create Date: 2026-03-30
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "002_users"
down_revision: str | None = "002_complete"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_accounts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("handle", sa.String(50), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=False),
        sa.Column("preferred_language", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_accounts_handle", "user_accounts", ["handle"], unique=True)

    op.add_column("submissions", sa.Column("target_word", sa.String(255), nullable=True))
    op.add_column("submissions", sa.Column("read_prompt", sa.Text(), nullable=True))
    op.add_column("submissions", sa.Column("image_prompt_url", sa.Text(), nullable=True))
    op.add_column("submissions", sa.Column("spontaneous_instruction", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("submissions", "spontaneous_instruction")
    op.drop_column("submissions", "image_prompt_url")
    op.drop_column("submissions", "read_prompt")
    op.drop_column("submissions", "target_word")
    op.drop_table("user_accounts")
