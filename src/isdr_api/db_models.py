from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    contributor_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    native_language_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    target_language_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    speaker_profile: Mapped[str] = mapped_column(String(255), nullable=False)
    consent_version: Mapped[str] = mapped_column(String(50), nullable=False)
    hometown: Mapped[str | None] = mapped_column(String(120), nullable=True)
    residence: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tribe_ethnicity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    age_group: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pair_group_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    riddle_part: Mapped[str | None] = mapped_column(String(20), nullable=True)
    challenge_submission_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reveal_submission_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    target_word: Mapped[str | None] = mapped_column(String(255), nullable=True)
    read_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_prompt_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    spontaneous_instruction: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    cid: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contributor_transcription: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PENDING_COMMUNITY", index=True
    )
    aggregate_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    community_ratings: Mapped[list[CommunityRating]] = relationship(
        "CommunityRating", back_populates="submission", cascade="all, delete-orphan"
    )
    contributor_translations: Mapped[list[ContributorTranslation]] = relationship(
        "ContributorTranslation", back_populates="submission", cascade="all, delete-orphan"
    )


class CommunityRating(Base):
    __tablename__ = "community_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rater_id: Mapped[str] = mapped_column(String(255), nullable=False)
    intelligibility: Mapped[int] = mapped_column(Integer, nullable=False)
    recording_quality: Mapped[int] = mapped_column(Integer, nullable=False)
    elicitation_compliance: Mapped[int] = mapped_column(Integer, nullable=False)
    weighted_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    submission: Mapped[Submission] = relationship(
        "Submission", back_populates="community_ratings"
    )


class GovernanceParam(Base):
    __tablename__ = "governance_params"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    community_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    quorum_q: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    theta_reject: Mapped[float] = mapped_column(Float, nullable=False, default=2.5)
    theta_accept: Mapped[float] = mapped_column(Float, nullable=False, default=3.5)
    w_intelligibility: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    w_recording: Mapped[float] = mapped_column(Float, nullable=False, default=0.35)
    w_compliance: Mapped[float] = mapped_column(Float, nullable=False, default=0.15)
    active_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    handle: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )


class ContributorTranslation(Base):
    """Translations provided by contributors as part of their submission."""

    __tablename__ = "contributor_translations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_language_code: Mapped[str] = mapped_column(String(20), nullable=False)
    target_language_code: Mapped[str] = mapped_column(String(20), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    translator_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="submitted", index=True
    )  # "submitted", "approved", "rejected"
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    submission: Mapped[Submission] = relationship(
        "Submission", back_populates="contributor_translations"
    )
