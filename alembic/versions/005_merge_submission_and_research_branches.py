"""Merge users collection branch with research-grade submission branch

Revision ID: 005
Revises: 002_users, 004
Create Date: 2026-04-09
"""
from __future__ import annotations

revision: str = "005"
down_revision = ("002_users", "004")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Merge-only revision: no schema ops.
    pass


def downgrade() -> None:
    # Merge-only revision: no schema ops.
    pass
