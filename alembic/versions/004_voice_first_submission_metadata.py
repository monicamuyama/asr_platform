"""Add voice-first metadata and linked-riddle fields to submissions

Revision ID: 004
Revises: 003
Create Date: 2026-04-09
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("submissions", sa.Column("native_language_code", sa.String(20), nullable=True))
    op.add_column("submissions", sa.Column("target_language_code", sa.String(20), nullable=True))
    op.add_column("submissions", sa.Column("category", sa.String(40), nullable=True))
    op.add_column("submissions", sa.Column("hometown", sa.String(120), nullable=True))
    op.add_column("submissions", sa.Column("residence", sa.String(120), nullable=True))
    op.add_column("submissions", sa.Column("tribe_ethnicity", sa.String(100), nullable=True))
    op.add_column("submissions", sa.Column("gender", sa.String(50), nullable=True))
    op.add_column("submissions", sa.Column("age_group", sa.String(50), nullable=True))
    op.add_column("submissions", sa.Column("pair_group_id", sa.String(36), nullable=True))
    op.add_column("submissions", sa.Column("riddle_part", sa.String(20), nullable=True))
    op.add_column("submissions", sa.Column("challenge_submission_id", sa.String(36), nullable=True))
    op.add_column("submissions", sa.Column("reveal_submission_id", sa.String(36), nullable=True))

    op.execute("UPDATE submissions SET native_language_code = language_code WHERE native_language_code IS NULL")
    op.execute("UPDATE submissions SET target_language_code = language_code WHERE target_language_code IS NULL")
    op.execute("UPDATE submissions SET category = 'proverb' WHERE category IS NULL")

    op.alter_column("submissions", "native_language_code", nullable=False)
    op.alter_column("submissions", "target_language_code", nullable=False)
    op.alter_column("submissions", "category", nullable=False)

    op.create_index("ix_submissions_native_language_code", "submissions", ["native_language_code"])
    op.create_index("ix_submissions_target_language_code", "submissions", ["target_language_code"])
    op.create_index("ix_submissions_category", "submissions", ["category"])
    op.create_index("ix_submissions_pair_group_id", "submissions", ["pair_group_id"])
    op.create_index("ix_submissions_challenge_submission_id", "submissions", ["challenge_submission_id"])
    op.create_index("ix_submissions_reveal_submission_id", "submissions", ["reveal_submission_id"])

    op.create_foreign_key(
        "fk_submissions_challenge_submission",
        "submissions",
        "submissions",
        ["challenge_submission_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_submissions_reveal_submission",
        "submissions",
        "submissions",
        ["reveal_submission_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_submissions_reveal_submission", "submissions", type_="foreignkey")
    op.drop_constraint("fk_submissions_challenge_submission", "submissions", type_="foreignkey")

    op.drop_index("ix_submissions_reveal_submission_id", table_name="submissions")
    op.drop_index("ix_submissions_challenge_submission_id", table_name="submissions")
    op.drop_index("ix_submissions_pair_group_id", table_name="submissions")
    op.drop_index("ix_submissions_category", table_name="submissions")
    op.drop_index("ix_submissions_target_language_code", table_name="submissions")
    op.drop_index("ix_submissions_native_language_code", table_name="submissions")

    op.drop_column("submissions", "reveal_submission_id")
    op.drop_column("submissions", "challenge_submission_id")
    op.drop_column("submissions", "riddle_part")
    op.drop_column("submissions", "pair_group_id")
    op.drop_column("submissions", "age_group")
    op.drop_column("submissions", "gender")
    op.drop_column("submissions", "tribe_ethnicity")
    op.drop_column("submissions", "residence")
    op.drop_column("submissions", "hometown")
    op.drop_column("submissions", "category")
    op.drop_column("submissions", "target_language_code")
    op.drop_column("submissions", "native_language_code")
