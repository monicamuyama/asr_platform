"""Add linguistic DNA schema with districts and tribal ethnicity

Revision ID: 003
Revises: 002_complete
Create Date: 2026-04-15
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: str | None = "002_complete"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ========================================================================
    # 1. CREATE DISTRICTS TABLE
    # ========================================================================
    
    op.create_table(
        "districts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("country_id", sa.String(36), nullable=False),
        sa.Column("region_id", sa.String(36), nullable=True),
        sa.Column("district_name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["countries.id"], name="fk_districts_country"),
        sa.ForeignKeyConstraint(["region_id"], ["regions.id"], name="fk_districts_region"),
        sa.PrimaryKeyConstraint("id", name="pk_districts"),
    )
    op.create_index("ix_districts_country_id", "districts", ["country_id"])
    
    # ========================================================================
    # 2. UPDATE USER_DEMOGRAPHICS TABLE
    # ========================================================================
    
    # Replace district string column with district_id foreign key
    op.add_column("user_demographics", sa.Column("district_id", sa.String(36), nullable=True))
    op.add_column("user_demographics", sa.Column("tribe_ethnicity", sa.String(100), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        "fk_user_demographics_district",
        "user_demographics",
        "districts",
        ["district_id"],
        ["id"],
    )
    
    # Drop old district column (if migrating from string-based district)
    # Note: This may need to be conditional depending on existing schema
    try:
        op.drop_column("user_demographics", "district")
    except Exception:
        # Column might not exist in all deployments
        pass


def downgrade() -> None:
    # ========================================================================
    # 1. REVERT USER_DEMOGRAPHICS TABLE
    # ========================================================================
    
    op.drop_constraint("fk_user_demographics_district", "user_demographics", type_="foreignkey")
    op.drop_column("user_demographics", "tribe_ethnicity")
    op.drop_column("user_demographics", "district_id")
    
    # Restore district as string column
    op.add_column("user_demographics", sa.Column("district", sa.String(100), nullable=True))
    
    # ========================================================================
    # 2. DROP DISTRICTS TABLE
    # ========================================================================
    
    op.drop_index("ix_districts_country_id", "districts")
    op.drop_table("districts")
