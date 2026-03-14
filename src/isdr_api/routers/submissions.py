from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models import Submission
from isdr_api.schemas import SubmissionCreate, SubmissionSchema

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionSchema)
def create_submission(payload: SubmissionCreate, db: Session = Depends(get_db)) -> Submission:
    submission = Submission(
        id=str(uuid.uuid4()),
        contributor_id=payload.contributor_id,
        language_code=payload.language_code,
        mode=payload.mode,
        speaker_profile=payload.speaker_profile,
        consent_version=payload.consent_version,
        status="PENDING_COMMUNITY",
        aggregate_score=None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionSchema])
def list_submissions(db: Session = Depends(get_db)) -> list[Submission]:
    return db.query(Submission).order_by(Submission.created_at.desc()).all()


@router.get("/{submission_id}", response_model=SubmissionSchema)
def get_submission(submission_id: str, db: Session = Depends(get_db)) -> Submission:
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission
