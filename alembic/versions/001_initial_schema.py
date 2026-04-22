"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-14
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "submissions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("contributor_id", sa.String(255), nullable=False),
        sa.Column("language_code", sa.String(20), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("speaker_profile", sa.String(255), nullable=False),
        sa.Column("consent_version", sa.String(50), nullable=False),
        sa.Column("audio_url", sa.Text(), nullable=True),
        sa.Column("cid", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("aggregate_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_submissions_contributor_id", "submissions", ["contributor_id"])
    op.create_index("ix_submissions_language_code", "submissions", ["language_code"])
    op.create_index("ix_submissions_status", "submissions", ["status"])

    op.create_table(
        "community_ratings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("submission_id", sa.String(36), nullable=False),
        sa.Column("rater_id", sa.String(255), nullable=False),
        sa.Column("intelligibility", sa.Integer(), nullable=False),
        sa.Column("recording_quality", sa.Integer(), nullable=False),
        sa.Column("elicitation_compliance", sa.Integer(), nullable=False),
        sa.Column("weighted_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_community_ratings_submission_id", "community_ratings", ["submission_id"]
    )

    op.create_table(
        "expert_reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("submission_id", sa.String(36), nullable=False),
        sa.Column("expert_id", sa.String(255), nullable=False),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("quality_tier", sa.String(50), nullable=True),
        sa.Column("condition_annotation", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_expert_reviews_submission_id", "expert_reviews", ["submission_id"]
    )

    op.create_table(
        "governance_params",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("community_key", sa.String(100), nullable=False),
        sa.Column("quorum_q", sa.Integer(), nullable=False),
        sa.Column("theta_reject", sa.Float(), nullable=False),
        sa.Column("theta_accept", sa.Float(), nullable=False),
        sa.Column("w_intelligibility", sa.Float(), nullable=False),
        sa.Column("w_recording", sa.Float(), nullable=False),
        sa.Column("w_compliance", sa.Float(), nullable=False),
        sa.Column("active_from", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_governance_params_community_key", "governance_params", ["community_key"]
    )

    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("actor_id", sa.String(255), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(255), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submission_id", sa.String(36), nullable=True),
        sa.ForeignKeyConstraint(
            ["submission_id"], ["submissions.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_events_submission_id", "audit_events", ["submission_id"])

    op.create_table(
        "tips",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("submission_id", sa.String(36), nullable=False),
        sa.Column("contributor_id", sa.String(255), nullable=False),
        sa.Column("tipper_id", sa.String(255), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tips_submission_id", "tips", ["submission_id"])
    op.create_index("ix_tips_contributor_id", "tips", ["contributor_id"])
    op.create_index("ix_tips_tipper_id", "tips", ["tipper_id"])


def downgrade() -> None:
    op.drop_table("tips")
    op.drop_table("audit_events")
    op.drop_table("governance_params")
    op.drop_table("expert_reviews")
    op.drop_table("community_ratings")
    op.drop_table("submissions")
