from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Submission
# ---------------------------------------------------------------------------


class SubmissionCreate(BaseModel):
    contributor_id: str = Field(min_length=1)
    language_code: str = Field(min_length=2)
    mode: Literal["prompted", "read", "spontaneous"]
    speaker_profile: str = Field(min_length=1)
    consent_version: str = Field(min_length=1)


class SubmissionSchema(BaseModel):
    id: str
    contributor_id: str
    language_code: str
    mode: str
    speaker_profile: str
    consent_version: str
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
