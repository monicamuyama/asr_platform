from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from isdr_core import CommunityRating as CoreRating, route_submission
from isdr_api.database import get_db
from isdr_api.db_models import CommunityRating, Submission
from isdr_api.governance_utils import get_active_governance
from isdr_api.schemas import QueueItemSchema, RatingCreate, RatingResultSchema

router = APIRouter(prefix="/community", tags=["community"])

_NON_RATEABLE = {"REJECTED_COMMUNITY", "PENDING_EXPERT", "ACCEPTED", "REJECTED_EXPERT"}


@router.get("/queue", response_model=list[QueueItemSchema])
def community_queue(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    submissions = (
        db.query(Submission)
        .filter(Submission.status.in_(["PENDING_COMMUNITY", "HOLD_COMMUNITY"]))
        .all()
    )
    result = []
    for s in submissions:
        ratings_count = (
            db.query(CommunityRating)
            .filter(CommunityRating.submission_id == s.id)
            .count()
        )
        result.append(
            {
                "id": s.id,
                "contributor_id": s.contributor_id,
                "language_code": s.language_code,
                "mode": s.mode,
                "speaker_profile": s.speaker_profile,
                "status": s.status,
                "ratings_count": ratings_count,
            }
        )
    return result


@router.post("/ratings", response_model=RatingResultSchema)
def rate_submission(payload: RatingCreate, db: Session = Depends(get_db)) -> dict[str, Any]:
    submission = db.query(Submission).filter(Submission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.status in _NON_RATEABLE:
        raise HTTPException(
            status_code=400, detail="Submission is no longer in community validation"
        )

    if submission.contributor_id == payload.rater_id:
        raise HTTPException(status_code=400, detail="Contributors cannot rate their own submission")

    duplicate = (
        db.query(CommunityRating)
        .filter(
            CommunityRating.submission_id == payload.submission_id,
            CommunityRating.rater_id == payload.rater_id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Rater has already rated this submission")

    params = get_active_governance(db)
    weighted_score = (
        payload.intelligibility * params.w_intelligibility
        + payload.recording_quality * params.w_recording
        + payload.elicitation_compliance * params.w_compliance
    )

    rating = CommunityRating(
        submission_id=payload.submission_id,
        rater_id=payload.rater_id,
        intelligibility=payload.intelligibility,
        recording_quality=payload.recording_quality,
        elicitation_compliance=payload.elicitation_compliance,
        weighted_score=weighted_score,
        created_at=datetime.now(timezone.utc),
    )
    db.add(rating)
    db.flush()

    all_ratings = (
        db.query(CommunityRating)
        .filter(CommunityRating.submission_id == payload.submission_id)
        .all()
    )

    core_ratings = [
        CoreRating(
            intelligibility=r.intelligibility,
            recording_quality=r.recording_quality,
            elicitation_compliance=r.elicitation_compliance,
        )
        for r in all_ratings
    ]

    decision = route_submission(ratings=core_ratings, params=params)

    submission.status = decision.status.value
    submission.aggregate_score = decision.aggregate_score
    db.commit()
    db.refresh(submission)

    return {
        "submission_id": payload.submission_id,
        "status": submission.status,
        "aggregate_score": submission.aggregate_score,
        "ratings_count": len(all_ratings),
        "reason": decision.reason,
    }
