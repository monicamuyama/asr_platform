"""Add complete research-grade schema

Revision ID: 002
Revises: 001
Create Date: 2026-04-01
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ========================================================================
    # 1. USER & AUTHENTICATION (extending users table)
    # ========================================================================

    # Update users table with new fields if needed
    op.add_column("users", sa.Column("phone_number", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("auth_provider", sa.String(50), nullable=False, server_default="local"))
    op.add_column("users", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("role", sa.String(50), nullable=False, server_default="contributor"))
    op.create_index("ix_users_phone_number", "users", ["phone_number"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    # user_profiles
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("primary_language", sa.String(100), nullable=True),
        sa.Column("preferred_contribution_type", sa.String(50), nullable=False, server_default="recording"),
        sa.Column("has_speech_impairment", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("impairment_type", sa.String(100), nullable=True),
        sa.Column("can_read_sentences", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("profile_photo_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)

    # ========================================================================
    # 2. GEOGRAPHY & LANGUAGE
    # ========================================================================

    op.create_table(
        "countries",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("country_name", sa.String(100), nullable=False),
        sa.Column("iso_code", sa.String(2), nullable=False),
        sa.Column("region", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_countries_iso_code", "countries", ["iso_code"], unique=True)

    op.create_table(
        "regions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("country_id", sa.String(36), nullable=False),
        sa.Column("region_name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["countries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_regions_country_id", "regions", ["country_id"])

    # Update languages table or create new one
    op.create_table(
        "languages",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("language_name", sa.String(100), nullable=False),
        sa.Column("iso_code", sa.String(3), nullable=False),
        sa.Column("country_id", sa.String(36), nullable=True),
        sa.Column("is_low_resource", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("speaker_count_approximate", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["countries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_languages_iso_code", "languages", ["iso_code"], unique=True)

    op.create_table(
        "dialects",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("language_id", sa.String(36), nullable=False),
        sa.Column("dialect_name", sa.String(100), nullable=False),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["language_id"], ["languages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_dialects_language_id", "dialects", ["language_id"])

    op.create_table(
        "speech_conditions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("condition_name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("research_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_speech_conditions_condition_name", "speech_conditions", ["condition_name"], unique=True)

    # ========================================================================
    # 3. CONSENT & DEMOGRAPHICS
    # ========================================================================

    op.create_table(
        "consent_documents",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("document_type", sa.String(100), nullable=False),
        sa.Column("version", sa.String(50), nullable=False),
        sa.Column("document_url", sa.String(500), nullable=False),
        sa.Column("content_hash", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_consents",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("document_id", sa.String(36), nullable=False),
        sa.Column("agreed", sa.Boolean(), nullable=False),
        sa.Column("agreed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["consent_documents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_consents_user_id", "user_consents", ["user_id"])

    op.create_table(
        "user_demographics",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("age_range", sa.String(50), nullable=True),
        sa.Column("gender", sa.String(50), nullable=True),
        sa.Column("country_id", sa.String(36), nullable=True),
        sa.Column("region_id", sa.String(36), nullable=True),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("native_language_id", sa.String(36), nullable=True),
        sa.Column("education_level", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["country_id"], ["countries.id"]),
        sa.ForeignKeyConstraint(["region_id"], ["regions.id"]),
        sa.ForeignKeyConstraint(["native_language_id"], ["languages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_demographics_user_id", "user_demographics", ["user_id"], unique=True)

    op.create_table(
        "user_speech_conditions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("condition_id", sa.String(36), nullable=False),
        sa.Column("severity_level", sa.String(50), nullable=False, server_default="mild"),
        sa.Column("is_willing_to_contribute_for_research", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["condition_id"], ["speech_conditions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_speech_conditions_user_id", "user_speech_conditions", ["user_id"])

    op.create_table(
        "user_language_preferences",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("language_id", sa.String(36), nullable=False),
        sa.Column("dialect_id", sa.String(36), nullable=True),
        sa.Column("is_primary_language", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_record", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_transcribe", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("can_validate", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("proficiency_level", sa.String(50), nullable=False, server_default="native"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["language_id"], ["languages.id"]),
        sa.ForeignKeyConstraint(["dialect_id"], ["dialects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_language_preferences_user_id", "user_language_preferences", ["user_id"])

    # ========================================================================
    # 4. CORPUS & RECORDINGS (expanding recordings)
    # ========================================================================

    op.create_table(
        "sentence_corpus",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("language_id", sa.String(36), nullable=False),
        sa.Column("dialect_id", sa.String(36), nullable=True),
        sa.Column("sentence_text", sa.Text(), nullable=False),
        sa.Column("domain", sa.String(50), nullable=False, server_default="casual"),
        sa.Column("source_type", sa.String(50), nullable=False, server_default="community"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["language_id"], ["languages.id"]),
        sa.ForeignKeyConstraint(["dialect_id"], ["dialects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sentence_corpus_language_id", "sentence_corpus", ["language_id"])

    # Expand recordings table
    op.add_column("recordings", sa.Column("sentence_id", sa.String(36), nullable=True))
    op.add_column("recordings", sa.Column("dialect_id", sa.String(36), nullable=True))
    op.add_column("recordings", sa.Column("audio_quality_score", sa.Float(), nullable=True))
    op.add_column("recordings", sa.Column("speaker_type", sa.String(50), nullable=False, server_default="normal"))
    op.add_column("recordings", sa.Column("recording_device", sa.String(50), nullable=False, server_default="mobile"))
    op.add_column("recordings", sa.Column("noise_level", sa.String(50), nullable=False, server_default="quiet"))

    op.create_foreign_key(None, "recordings", "sentence_corpus", ["sentence_id"], ["id"])
    op.create_foreign_key(None, "recordings", "dialects", ["dialect_id"], ["id"])
    op.create_index("ix_recordings_dialect_id", "recordings", ["dialect_id"])

    # ========================================================================
    # 5. VALIDATION PIPELINE
    # ========================================================================

    op.create_table(
        "validation_tasks",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("recording_id", sa.String(36), nullable=False),
        sa.Column("validator_id", sa.String(36), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("is_clear_audio", sa.Boolean(), nullable=False),
        sa.Column("is_correct_sentence", sa.Boolean(), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["recordings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_validation_tasks_recording_id", "validation_tasks", ["recording_id"])
    op.create_index("ix_validation_tasks_validator_id", "validation_tasks", ["validator_id"])

    op.create_table(
        "transcription_tasks",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("recording_id", sa.String(36), nullable=False),
        sa.Column("transcriber_id", sa.String(36), nullable=False),
        sa.Column("transcribed_text", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["recordings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transcription_tasks_recording_id", "transcription_tasks", ["recording_id"])
    op.create_index("ix_transcription_tasks_transcriber_id", "transcription_tasks", ["transcriber_id"])

    op.create_table(
        "transcription_validations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("transcription_id", sa.String(36), nullable=False),
        sa.Column("validator_id", sa.String(36), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("suggested_correction", sa.Text(), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["transcription_id"], ["transcription_tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transcription_validations_transcription_id", "transcription_validations", ["transcription_id"])

    # ========================================================================
    # 6. EXPERT REVIEW & DICTIONARY
    # ========================================================================

    op.create_table(
        "expert_reviews",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("recording_id", sa.String(36), nullable=False),
        sa.Column("expert_id", sa.String(36), nullable=False),
        sa.Column("is_approved", sa.Boolean(), nullable=False),
        sa.Column("corrected_text", sa.Text(), nullable=True),
        sa.Column("quality_tier", sa.String(50), nullable=False, server_default="Standard"),
        sa.Column("condition_annotation", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("added_to_dictionary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["recordings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_expert_reviews_recording_id", "expert_reviews", ["recording_id"])

    op.create_table(
        "pronunciation_dictionary",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("word", sa.String(255), nullable=False),
        sa.Column("language_id", sa.String(36), nullable=False),
        sa.Column("dialect_id", sa.String(36), nullable=True),
        sa.Column("phoneme_representation", sa.String(500), nullable=False),
        sa.Column("audio_reference_id", sa.String(36), nullable=True),
        sa.Column("verified_by", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["language_id"], ["languages.id"]),
        sa.ForeignKeyConstraint(["dialect_id"], ["dialects.id"]),
        sa.ForeignKeyConstraint(["audio_reference_id"], ["recordings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pronunciation_dictionary_word", "pronunciation_dictionary", ["word"])

    op.create_table(
        "dataset_speaker_ids",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("speaker_code", sa.String(50), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("language_code", sa.String(3), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_dataset_speaker_ids_user_id", "dataset_speaker_ids", ["user_id"], unique=True)
    op.create_index("ix_dataset_speaker_ids_speaker_code", "dataset_speaker_ids", ["speaker_code"], unique=True)

    op.create_table(
        "dataset_entries",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("recording_id", sa.String(36), nullable=False),
        sa.Column("speaker_id", sa.String(36), nullable=False),
        sa.Column("final_transcription", sa.Text(), nullable=False),
        sa.Column("speaker_type", sa.String(50), nullable=False),
        sa.Column("quality_tier", sa.String(50), nullable=False),
        sa.Column("dataset_version", sa.String(50), nullable=False, server_default="1.0"),
        sa.Column("added_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["recordings.id"]),
        sa.ForeignKeyConstraint(["speaker_id"], ["dataset_speaker_ids.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_dataset_entries_recording_id", "dataset_entries", ["recording_id"], unique=True)
    op.create_index("ix_dataset_entries_speaker_id", "dataset_entries", ["speaker_id"])

    op.create_table(
        "dataset_analytics",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("dataset_entry_id", sa.String(36), nullable=False),
        sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_accessed", sa.DateTime(timezone=True), nullable=True),
        sa.Column("research_project_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["dataset_entry_id"], ["dataset_entries.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ========================================================================
    # 7. FINANCIAL SYSTEM
    # ========================================================================

    op.create_table(
        "wallets",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("last_updated", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wallets_user_id", "wallets", ["user_id"], unique=True)

    op.create_table(
        "donations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("donor_id", sa.String(36), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.String(36), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("payment_method", sa.String(50), nullable=False),
        sa.Column("stripe_transaction_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_donations_donor_id", "donations", ["donor_id"])

    # Expand tips table
    op.add_column("tips", sa.Column("contributor_id", sa.String(36), nullable=False, server_default="unknown"))
    op.drop_column("tips", "submission_id")
    op.add_column("tips", sa.Column("recording_id", sa.String(36), nullable=False, server_default="unknown"))
    op.create_foreign_key(None, "tips", "recordings", ["recording_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_tips_recording_id", "tips", ["recording_id"])
    op.create_index("ix_tips_contributor_id", "tips", ["contributor_id"])

    op.create_table(
        "reward_pools",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("language_id", sa.String(36), nullable=False),
        sa.Column("pool_name", sa.String(255), nullable=False),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("amount_distributed", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("reward_per_recording", sa.Float(), nullable=False),
        sa.Column("reward_per_validation", sa.Float(), nullable=False),
        sa.Column("reward_per_transcription", sa.Float(), nullable=False),
        sa.Column("reward_per_expert_review", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expired_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["language_id"], ["languages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reward_transactions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("pool_id", sa.String(36), nullable=False),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("task_id", sa.String(36), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["pool_id"], ["reward_pools.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reward_transactions_user_id", "reward_transactions", ["user_id"])


def downgrade() -> None:
    # Reverse order of drops
    op.drop_table("reward_transactions")
    op.drop_table("reward_pools")
    op.drop_index("ix_tips_contributor_id", table_name="tips")
    op.drop_index("ix_tips_recording_id", table_name="tips")
    op.drop_table("donations")
    op.drop_table("wallets")
    op.drop_table("dataset_analytics")
    op.drop_table("dataset_entries")
    op.drop_table("dataset_speaker_ids")
    op.drop_table("pronunciation_dictionary")
    op.drop_index("ix_expert_reviews_recording_id", table_name="expert_reviews")
    op.drop_table("expert_reviews")
    op.drop_table("transcription_validations")
    op.drop_table("transcription_tasks")
    op.drop_table("validation_tasks")
    op.drop_index("ix_recordings_dialect_id", table_name="recordings")
    op.drop_table("sentence_corpus")
    op.drop_index("ix_user_language_preferences_user_id", table_name="user_language_preferences")
    op.drop_table("user_language_preferences")
    op.drop_index("ix_user_speech_conditions_user_id", table_name="user_speech_conditions")
    op.drop_table("user_speech_conditions")
    op.drop_index("ix_user_demographics_user_id", table_name="user_demographics")
    op.drop_table("user_demographics")
    op.drop_index("ix_user_consents_user_id", table_name="user_consents")
    op.drop_table("user_consents")
    op.drop_table("consent_documents")
    op.drop_index("ix_dialects_language_id", table_name="dialects")
    op.drop_table("dialects")
    op.drop_index("ix_languages_iso_code", table_name="languages")
    op.drop_table("languages")
    op.drop_index("ix_regions_country_id", table_name="regions")
    op.drop_table("regions")
    op.drop_index("ix_countries_iso_code", table_name="countries")
    op.drop_table("countries")
    op.drop_index("ix_speech_conditions_condition_name", table_name="speech_conditions")
    op.drop_table("speech_conditions")
    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_phone_number", table_name="users")
    op.drop_column("users", "role")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "phone_number")
