from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models import AuditEvent, ExpertReview, Submission
from isdr_api.schemas import ExpertQueueItemSchema, ExpertReviewCreate, ExpertReviewSchema

router = APIRouter(prefix="/expert", tags=["expert"])


@router.get("/queue", response_model=list[ExpertQueueItemSchema])
def expert_queue(db: Session = Depends(get_db)) -> list[Submission]:
    return db.query(Submission).filter(Submission.status == "PENDING_EXPERT").all()


@router.post("/reviews", response_model=ExpertReviewSchema)
def submit_expert_review(
    payload: ExpertReviewCreate, db: Session = Depends(get_db)
) -> ExpertReview:
    submission = db.query(Submission).filter(Submission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.status != "PENDING_EXPERT":
        raise HTTPException(
            status_code=400, detail="Submission is not in PENDING_EXPERT status"
        )

    if payload.decision == "accepted" and payload.quality_tier is None:
        raise HTTPException(
            status_code=400, detail="quality_tier is required when accepting a submission"
        )

    review = ExpertReview(
        submission_id=payload.submission_id,
        expert_id=payload.expert_id,
        decision=payload.decision,
        quality_tier=payload.quality_tier,
        condition_annotation=payload.condition_annotation,
        notes=payload.notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)

    submission.status = "ACCEPTED" if payload.decision == "accepted" else "REJECTED_EXPERT"

    audit = AuditEvent(
        actor_id=payload.expert_id,
        entity_type="submission",
        entity_id=payload.submission_id,
        action=f"expert_{payload.decision}",
        payload=f"quality_tier={payload.quality_tier}, condition={payload.condition_annotation}",
        created_at=datetime.now(timezone.utc),
        submission_id=payload.submission_id,
    )
    db.add(audit)

    db.commit()
    db.refresh(review)
    return review
