from __future__ import annotations

from .models import CommunityRating, GovernanceParams, RoutingDecision, SubmissionStatus


def _weighted_score(rating: CommunityRating, params: GovernanceParams) -> float:
    rating.validate()
    return (
        rating.intelligibility * params.w_intelligibility
        + rating.recording_quality * params.w_recording
        + rating.elicitation_compliance * params.w_compliance
    )


def _trimmed_mean(values: list[float]) -> float:
    if len(values) < 3:
        raise ValueError("trimmed mean requires at least 3 values")
    ordered = sorted(values)
    trimmed = ordered[1:-1]
    return sum(trimmed) / len(trimmed)


def route_submission(
    ratings: list[CommunityRating],
    params: GovernanceParams,
) -> RoutingDecision:
    params.validate()

    if len(ratings) < params.quorum_q:
        return RoutingDecision(
            status=SubmissionStatus.PENDING_COMMUNITY,
            aggregate_score=None,
            ratings_count=len(ratings),
            reason="Waiting for quorum",
        )

    considered = ratings[: params.quorum_q]
    weighted_scores = [_weighted_score(r, params) for r in considered]
    aggregate = _trimmed_mean(weighted_scores)

    if aggregate < params.theta_reject:
        return RoutingDecision(
            status=SubmissionStatus.REJECTED_COMMUNITY,
            aggregate_score=aggregate,
            ratings_count=params.quorum_q,
            reason="Aggregate score below rejection threshold",
        )

    if aggregate < params.theta_accept:
        return RoutingDecision(
            status=SubmissionStatus.HOLD_COMMUNITY,
            aggregate_score=aggregate,
            ratings_count=params.quorum_q,
            reason="Aggregate score in hold band",
        )

    return RoutingDecision(
        status=SubmissionStatus.PENDING_EXPERT,
        aggregate_score=aggregate,
        ratings_count=params.quorum_q,
        reason="Aggregate score meets acceptance threshold",
    )
