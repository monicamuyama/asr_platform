from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserRegister(BaseModel):
    handle: str = Field(min_length=3, max_length=50)
    display_name: str = Field(min_length=1, max_length=120)
    preferred_language: str = Field(min_length=2, max_length=20)


class UserSchema(BaseModel):
    id: str
    handle: str
    display_name: str
    preferred_language: str
    created_at: datetime

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Submission
# ---------------------------------------------------------------------------


class SubmissionCreate(BaseModel):
    contributor_id: str = Field(min_length=1)
    language_code: str = Field(min_length=2)
    mode: Literal["prompted", "recording", "read_out", "spontaneous_image"]
    speaker_profile: str = Field(min_length=1)
    consent_version: str = Field(min_length=1)
    audio_url: Optional[str] = None
    cid: Optional[str] = None
    target_word: Optional[str] = None
    read_prompt: Optional[str] = None
    image_prompt_url: Optional[str] = None
    spontaneous_instruction: Optional[str] = None

    @model_validator(mode="after")
    def validate_mode_requirements(self) -> "SubmissionCreate":
        if self.mode == "recording" and not self.target_word:
            raise ValueError("target_word is required for recording mode")
        if self.mode == "read_out":
            if not self.target_word:
                raise ValueError("target_word is required for read_out mode")
            if not self.read_prompt:
                raise ValueError("read_prompt is required for read_out mode")
        if self.mode == "spontaneous_image":
            if not self.image_prompt_url:
                raise ValueError("image_prompt_url is required for spontaneous_image mode")
            if not self.spontaneous_instruction:
                raise ValueError(
                    "spontaneous_instruction is required for spontaneous_image mode"
                )
        return self


class SubmissionSchema(BaseModel):
    id: str
    contributor_id: str
    language_code: str
    mode: str
    speaker_profile: str
    consent_version: str
    audio_url: Optional[str] = None
    cid: Optional[str] = None
    target_word: Optional[str] = None
    read_prompt: Optional[str] = None
    image_prompt_url: Optional[str] = None
    spontaneous_instruction: Optional[str] = None
    status: str
    aggregate_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Community validation
# ---------------------------------------------------------------------------


class RatingCreate(BaseModel):
    submission_id: str
    rater_id: str = Field(min_length=1)
    intelligibility: int = Field(ge=1, le=5)
    recording_quality: int = Field(ge=1, le=5)
    elicitation_compliance: int = Field(ge=1, le=5)


class QueueItemSchema(BaseModel):
    id: str
    contributor_id: str
    language_code: str
    mode: str
    speaker_profile: str
    status: str
    ratings_count: int


class RatingResultSchema(BaseModel):
    submission_id: str
    status: str
    aggregate_score: Optional[float] = None
    ratings_count: int
    reason: str


# ---------------------------------------------------------------------------
# Expert validation
# ---------------------------------------------------------------------------


class ExpertReviewCreate(BaseModel):
    submission_id: str
    expert_id: str = Field(min_length=1)
    decision: Literal["accepted", "rejected"]
    quality_tier: Optional[Literal["Standard", "High", "Reference"]] = None
    condition_annotation: Optional[str] = None
    notes: Optional[str] = None


class ExpertReviewSchema(BaseModel):
    id: int
    submission_id: str
    expert_id: str
    decision: str
    quality_tier: Optional[str] = None
    condition_annotation: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpertQueueItemSchema(BaseModel):
    id: str
    contributor_id: str
    language_code: str
    mode: str
    speaker_profile: str
    status: str
    aggregate_score: Optional[float] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Tipping
# ---------------------------------------------------------------------------


class TipCreate(BaseModel):
    submission_id: str
    tipper_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    currency: Literal["USD", "EUR", "GBP"] = "USD"
    message: Optional[str] = None


class TipSchema(BaseModel):
    id: int
    submission_id: str
    contributor_id: str
    tipper_id: str
    amount: float
    rating: int
    currency: str
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributorTipSummarySchema(BaseModel):
    contributor_id: str
    total_tips: int
    total_amount: float
    average_rating: Optional[float] = None


# ---------------------------------------------------------------------------
# Governance
# ---------------------------------------------------------------------------


class GovernanceParamSchema(BaseModel):
    community_key: str
    quorum_q: int
    theta_reject: float
    theta_accept: float
    w_intelligibility: float
    w_recording: float
    w_compliance: float
    active_from: Optional[datetime] = None

    model_config = {"from_attributes": True}
