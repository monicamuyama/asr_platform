from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models import CommunityRating, GovernanceParam, Submission
from isdr_api.db_models_extended import Wallet
from isdr_api.schemas import (
    QueueItemSchema,
    RatingCreate,
    RatingHistoryItemSchema,
    RatingResultSchema,
    SubmissionCreate,
    SubmissionSchema,
)
from isdr_core.models import CommunityRating as RoutingCommunityRating, GovernanceParams
from isdr_core.routing import route_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])

REWARD_PER_RECORDING = 10.0
REWARD_PER_VALIDATION = 3.0


def _normalize_sentence(value: str | None) -> str:
    if value is None:
        return ""
    return " ".join(value.split()).strip().lower()


def _credit_wallet(db: Session, user_id: str, amount: float) -> None:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if wallet is None:
        wallet = Wallet(user_id=user_id, balance=0.0, currency="USD")
        db.add(wallet)
        db.flush()

    wallet.balance = float(wallet.balance) + amount
    wallet.last_updated = datetime.now(timezone.utc)


def _get_active_governance_params(db: Session) -> GovernanceParams:
    config = (
        db.query(GovernanceParam)
        .order_by(GovernanceParam.active_from.desc())
        .first()
    )
    if config is None:
        return GovernanceParams(quorum_q=5, theta_reject=2.5, theta_accept=3.5)

    return GovernanceParams(
        quorum_q=config.quorum_q,
        theta_reject=config.theta_reject,
        theta_accept=config.theta_accept,
        w_intelligibility=config.w_intelligibility,
        w_recording=config.w_recording,
        w_compliance=config.w_compliance,
    )


def _route_submission(submission_id: str, db: Session) -> RatingResultSchema:
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    db_ratings = (
        db.query(CommunityRating)
        .filter(CommunityRating.submission_id == submission_id)
        .order_by(CommunityRating.created_at.asc())
        .all()
    )

    routing_ratings = [
        RoutingCommunityRating(
            intelligibility=rating.intelligibility,
            recording_quality=rating.recording_quality,
            elicitation_compliance=rating.elicitation_compliance,
        )
        for rating in db_ratings
    ]
    decision = route_submission(routing_ratings, _get_active_governance_params(db))

    submission.status = decision.status.value
    submission.aggregate_score = decision.aggregate_score
    db.flush()

    return RatingResultSchema(
        submission_id=submission_id,
        status=submission.status,
        aggregate_score=submission.aggregate_score,
        ratings_count=decision.ratings_count,
        reason=decision.reason,
    )


@router.post("", response_model=SubmissionSchema)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)) -> Submission:
    if payload.mode == "recording":
        normalized_target = _normalize_sentence(payload.target_word)
        existing_recordings = (
            db.query(Submission)
            .filter(
                Submission.contributor_id == payload.contributor_id,
                Submission.mode == "recording",
            )
            .all()
        )
        duplicate_exists = any(
            _normalize_sentence(existing.target_word) == normalized_target
            for existing in existing_recordings
        )
        if duplicate_exists:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted a recording for this sentence.",
            )

    submission = Submission(
        id=str(uuid.uuid4()),
        contributor_id=payload.contributor_id,
        language_code=payload.language_code,
        mode=payload.mode,
        speaker_profile=payload.speaker_profile,
        consent_version=payload.consent_version,
        audio_url=payload.audio_url,
        cid=payload.cid,
        target_word=payload.target_word,
        read_prompt=payload.read_prompt,
        image_prompt_url=payload.image_prompt_url,
        spontaneous_instruction=payload.spontaneous_instruction,
        status="PENDING_COMMUNITY",
        aggregate_score=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    _credit_wallet(db, payload.contributor_id, REWARD_PER_RECORDING)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionSchema])
def list_submissions(db: Session = Depends(get_db)) -> list[Submission]:
    return db.query(Submission).order_by(Submission.created_at.desc()).all()


@router.get("/queue", response_model=list[QueueItemSchema])
def list_community_queue(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    submissions = (
        db.query(Submission)
        .filter(Submission.status.in_(["PENDING_COMMUNITY", "HOLD_COMMUNITY"]))
        .order_by(Submission.created_at.asc())
        .all()
    )
    return [
        {
            "id": submission.id,
            "contributor_id": submission.contributor_id,
            "language_code": submission.language_code,
            "mode": submission.mode,
            "speaker_profile": submission.speaker_profile,
            "target_word": submission.target_word,
            "read_prompt": submission.read_prompt,
            "image_prompt_url": submission.image_prompt_url,
            "spontaneous_instruction": submission.spontaneous_instruction,
            "audio_url": submission.audio_url,
            "status": submission.status,
            "ratings_count": len(submission.community_ratings),
        }
        for submission in submissions
    ]


@router.post("/{submission_id}/ratings", response_model=RatingResultSchema)
def create_community_rating(submission_id: str, payload: RatingCreate, db: Session = Depends(get_db)) -> RatingResultSchema:
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.contributor_id == payload.rater_id:
        raise HTTPException(status_code=400, detail="Contributors cannot rate their own submission")

    existing_rating = (
        db.query(CommunityRating)
        .filter(
            CommunityRating.submission_id == submission_id,
            CommunityRating.rater_id == payload.rater_id,
        )
        .first()
    )
    if existing_rating:
        raise HTTPException(status_code=400, detail="You have already rated this submission")

    weighted_score = (
        payload.intelligibility * 0.5
        + payload.recording_quality * 0.35
        + payload.elicitation_compliance * 0.15
    )

    rating = CommunityRating(
        submission_id=submission_id,
        rater_id=payload.rater_id,
        intelligibility=payload.intelligibility,
        recording_quality=payload.recording_quality,
        elicitation_compliance=payload.elicitation_compliance,
        weighted_score=weighted_score,
        created_at=datetime.now(timezone.utc),
    )
    db.add(rating)
    _credit_wallet(db, payload.rater_id, REWARD_PER_VALIDATION)
    db.flush()

    result = _route_submission(submission_id, db)
    db.commit()
    return result


@router.get("/ratings/by/{rater_id}", response_model=list[RatingHistoryItemSchema])
def list_ratings_by_rater(rater_id: str, db: Session = Depends(get_db)) -> list[dict[str, object]]:
    rows = (
        db.query(CommunityRating, Submission)
        .join(Submission, CommunityRating.submission_id == Submission.id)
        .filter(CommunityRating.rater_id == rater_id)
        .order_by(CommunityRating.created_at.desc())
        .all()
    )

    return [
        {
            "submission_id": submission.id,
            "language_code": submission.language_code,
            "mode": submission.mode,
            "submission_status": submission.status,
            "created_at": rating.created_at,
        }
        for rating, submission in rows
    ]


@router.get("/{submission_id}", response_model=SubmissionSchema)
def get_submission(submission_id: str, db: Session = Depends(get_db)) -> Submission:
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
