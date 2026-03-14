from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class SubmissionStatus(str, Enum):
    PENDING_COMMUNITY = "PENDING_COMMUNITY"
    HOLD_COMMUNITY = "HOLD_COMMUNITY"
    PENDING_EXPERT = "PENDING_EXPERT"
    REJECTED_COMMUNITY = "REJECTED_COMMUNITY"
    ACCEPTED = "ACCEPTED"
    REJECTED_EXPERT = "REJECTED_EXPERT"


@dataclass(frozen=True)
class GovernanceParams:
    quorum_q: int
    theta_reject: float
    theta_accept: float
    w_intelligibility: float = 0.5
    w_recording: float = 0.35
    w_compliance: float = 0.15

    def validate(self) -> None:
        if self.quorum_q < 3:
            raise ValueError("quorum_q must be >= 3 to support trimmed mean")
        if self.theta_reject >= self.theta_accept:
            raise ValueError("theta_reject must be < theta_accept")
        weights_sum = self.w_intelligibility + self.w_recording + self.w_compliance
        if abs(weights_sum - 1.0) > 1e-9:
            raise ValueError("weights must sum to 1.0")


@dataclass(frozen=True)
class CommunityRating:
    intelligibility: int
    recording_quality: int
    elicitation_compliance: int

    def validate(self) -> None:
        for field_name, score in (
            ("intelligibility", self.intelligibility),
            ("recording_quality", self.recording_quality),
            ("elicitation_compliance", self.elicitation_compliance),
        ):
            if score < 1 or score > 5:
                raise ValueError(f"{field_name} must be between 1 and 5")


@dataclass(frozen=True)
class RoutingDecision:
    status: SubmissionStatus
    aggregate_score: float | None
    ratings_count: int
    reason: str
