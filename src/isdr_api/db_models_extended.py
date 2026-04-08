from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================================
# 1. USER & AUTHENTICATION
# ============================================================================


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="local")
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="contributor", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    # Relationships
    profile: Mapped[UserProfile | None] = relationship(
        "UserProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    demographics: Mapped[UserDemographics | None] = relationship(
        "UserDemographics", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    speech_conditions: Mapped[list[UserSpeechCondition]] = relationship(
        "UserSpeechCondition", back_populates="user", cascade="all, delete-orphan"
    )
    consents: Mapped[list[UserConsent]] = relationship(
        "UserConsent", back_populates="user", cascade="all, delete-orphan"
    )
    language_preferences: Mapped[list[UserLanguagePreference]] = relationship(
        "UserLanguagePreference", back_populates="user", cascade="all, delete-orphan"
    )
    recordings: Mapped[list[Recording]] = relationship(
        "Recording", back_populates="user", cascade="all, delete-orphan"
    )
    wallet: Mapped[Wallet | None] = relationship(
        "Wallet", back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_contribution_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="recording"
    )

    has_speech_impairment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    impairment_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    can_read_sentences: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="profile")


class UserDemographics(Base):
    __tablename__ = "user_demographics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    age_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)

    country_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("countries.id"), nullable=True)
    region_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("regions.id"), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)

    native_language_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("languages.id"), nullable=True)
    education_level: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="demographics")
    country: Mapped[Country | None] = relationship("Country")
    region: Mapped[Region | None] = relationship("Region")
    native_language: Mapped[Language | None] = relationship("Language")


class UserSpeechCondition(Base):
    __tablename__ = "user_speech_conditions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    condition_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("speech_conditions.id"), nullable=False
    )

    severity_level: Mapped[str] = mapped_column(String(50), nullable=False, default="mild")
    is_willing_to_contribute_for_research: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="speech_conditions")
    condition: Mapped[SpeechCondition] = relationship("SpeechCondition")


# ============================================================================
# 2. CONSENT & LEGAL
# ============================================================================


class ConsentDocument(Base):
    __tablename__ = "consent_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    document_url: Mapped[str] = mapped_column(String(500), nullable=False)
    content_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class UserConsent(Base):
    __tablename__ = "user_consents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("consent_documents.id"), nullable=False
    )

    agreed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    agreed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="consents")
    document: Mapped[ConsentDocument] = relationship("ConsentDocument")


# ============================================================================
# 3. GEOGRAPHY & LANGUAGE
# ============================================================================


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    country_name: Mapped[str] = mapped_column(String(100), nullable=False)
    iso_code: Mapped[str] = mapped_column(String(2), unique=True, nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    country_id: Mapped[str] = mapped_column(String(36), ForeignKey("countries.id"), nullable=False, index=True)
    region_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    country: Mapped[Country] = relationship("Country")


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    language_name: Mapped[str] = mapped_column(String(100), nullable=False)
    iso_code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False, index=True)
    country_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("countries.id"), nullable=True)

    is_low_resource: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    speaker_count_approximate: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    country: Mapped[Country | None] = relationship("Country")


class Dialect(Base):
    __tablename__ = "dialects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False, index=True)
    dialect_name: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    language: Mapped[Language] = relationship("Language")


class SpeechCondition(Base):
    __tablename__ = "speech_conditions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    condition_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    research_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)


class UserLanguagePreference(Base):
    __tablename__ = "user_language_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False)
    dialect_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("dialects.id"), nullable=True)

    is_primary_language: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_record: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_transcribe: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    can_validate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    proficiency_level: Mapped[str] = mapped_column(String(50), nullable=False, default="native")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="language_preferences")
    language: Mapped[Language] = relationship("Language")
    dialect: Mapped[Dialect | None] = relationship("Dialect")


# ============================================================================
# 4. CORPUS & SENTENCES
# ============================================================================


class SentenceCorpus(Base):
    __tablename__ = "sentence_corpus"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False, index=True)
    dialect_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("dialects.id"), nullable=True)

    sentence_text: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), nullable=False, default="casual")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="community")

    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    language: Mapped[Language] = relationship("Language")
    dialect: Mapped[Dialect | None] = relationship("Dialect")


# ============================================================================
# 5. RECORDINGS & VALIDATION
# ============================================================================


class Recording(Base):
    __tablename__ = "recordings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    sentence_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sentence_corpus.id"), nullable=True)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False, index=True)
    dialect_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("dialects.id"), nullable=True)

    audio_url: Mapped[str] = mapped_column(String(500), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    audio_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    speaker_type: Mapped[str] = mapped_column(String(50), nullable=False, default="normal")
    recording_device: Mapped[str] = mapped_column(String(50), nullable=False, default="mobile")
    noise_level: Mapped[str] = mapped_column(String(50), nullable=False, default="quiet")

    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="new", index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="recordings")
    language: Mapped[Language] = relationship("Language")
    dialect: Mapped[Dialect | None] = relationship("Dialect")
    sentence: Mapped[SentenceCorpus | None] = relationship("SentenceCorpus")
    validation_tasks: Mapped[list[ValidationTask]] = relationship(
        "ValidationTask", back_populates="recording", cascade="all, delete-orphan"
    )
    transcription_tasks: Mapped[list[TranscriptionTask]] = relationship(
        "TranscriptionTask", back_populates="recording", cascade="all, delete-orphan"
    )
    expert_reviews: Mapped[list[ExpertReview]] = relationship(
        "ExpertReview", back_populates="recording", cascade="all, delete-orphan"
    )
    tips: Mapped[list[Tip]] = relationship(
        "Tip", back_populates="recording", cascade="all, delete-orphan"
    )


class ValidationTask(Base):
    __tablename__ = "validation_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    recording_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    validator_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    is_clear_audio: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_correct_sentence: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    recording: Mapped[Recording] = relationship("Recording", back_populates="validation_tasks")


class TranscriptionTask(Base):
    __tablename__ = "transcription_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    recording_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transcriber_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    transcribed_text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    recording: Mapped[Recording] = relationship("Recording", back_populates="transcription_tasks")
    validations: Mapped[list[TranscriptionValidation]] = relationship(
        "TranscriptionValidation", back_populates="transcription", cascade="all, delete-orphan"
    )


class TranscriptionValidation(Base):
    __tablename__ = "transcription_validations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    transcription_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("transcription_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    validator_id: Mapped[str] = mapped_column(String(36), nullable=False)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    suggested_correction: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    transcription: Mapped[TranscriptionTask] = relationship(
        "TranscriptionTask", back_populates="validations"
    )


# ============================================================================
# 6. EXPERT REVIEW & DICTIONARY
# ============================================================================


class ExpertReview(Base):
    __tablename__ = "expert_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    recording_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expert_id: Mapped[str] = mapped_column(String(36), nullable=False)

    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False)
    corrected_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_tier: Mapped[str] = mapped_column(String(50), nullable=False, default="Standard")
    condition_annotation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False)

    added_to_dictionary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    recording: Mapped[Recording] = relationship("Recording", back_populates="expert_reviews")


class PronunciationDictionary(Base):
    __tablename__ = "pronunciation_dictionary"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    word: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False)
    dialect_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("dialects.id"), nullable=True)

    phoneme_representation: Mapped[str] = mapped_column(String(500), nullable=False)
    audio_reference_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("recordings.id"), nullable=True
    )
    verified_by: Mapped[str] = mapped_column(String(36), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    language: Mapped[Language] = relationship("Language")
    dialect: Mapped[Dialect | None] = relationship("Dialect")
    audio_reference: Mapped[Recording | None] = relationship("Recording")


class DatasetEntry(Base):
    __tablename__ = "dataset_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    recording_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recordings.id"), nullable=False, unique=True, index=True
    )
    speaker_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("dataset_speaker_ids.id"), nullable=False, index=True
    )

    final_transcription: Mapped[str] = mapped_column(Text, nullable=False)
    speaker_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quality_tier: Mapped[str] = mapped_column(String(50), nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0")

    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    recording: Mapped[Recording] = relationship("Recording")
    speaker: Mapped[DatasetSpeakerId] = relationship("DatasetSpeakerId")


class DatasetSpeakerId(Base):
    __tablename__ = "dataset_speaker_ids"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    speaker_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    language_code: Mapped[str] = mapped_column(String(3), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)


# ============================================================================
# 7. FINANCIAL SYSTEM
# ============================================================================


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    user: Mapped[User] = relationship("User", back_populates="wallet")


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    donor_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    stripe_transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)


class Tip(Base):
    __tablename__ = "tips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    recording_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contributor_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    tipper_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    recording: Mapped[Recording] = relationship("Recording", back_populates="tips")


class RewardPool(Base):
    __tablename__ = "reward_pools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    language_id: Mapped[str] = mapped_column(String(36), ForeignKey("languages.id"), nullable=False)

    pool_name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    amount_distributed: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    reward_per_recording: Mapped[float] = mapped_column(Float, nullable=False)
    reward_per_validation: Mapped[float] = mapped_column(Float, nullable=False)
    reward_per_transcription: Mapped[float] = mapped_column(Float, nullable=False)
    reward_per_expert_review: Mapped[float] = mapped_column(Float, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)
    expired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    language: Mapped[Language] = relationship("Language")


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    pool_id: Mapped[str] = mapped_column(String(36), ForeignKey("reward_pools.id"), nullable=False)

    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    task_id: Mapped[str] = mapped_column(String(36), nullable=False)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    pool: Mapped[RewardPool] = relationship("RewardPool")


# ============================================================================
# 8. AUDIT & ANALYTICS
# ============================================================================


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    actor_id: Mapped[str] = mapped_column(String(36), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now, index=True)


class DatasetAnalytics(Base):
    __tablename__ = "dataset_analytics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    dataset_entry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("dataset_entries.id"), nullable=False, unique=True
    )

    download_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_accessed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    research_project_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_now)

    dataset_entry: Mapped[DatasetEntry] = relationship("DatasetEntry")
