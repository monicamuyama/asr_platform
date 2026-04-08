from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models import AuditEvent, Submission, Tip
from isdr_api.schemas import ContributorTipSummarySchema, TipCreate, TipSchema

router = APIRouter(prefix="/tips", tags=["tips"])


@router.post("", response_model=TipSchema)
def create_tip(payload: TipCreate, db: Session = Depends(get_db)) -> Tip:
    submission = db.query(Submission).filter(Submission.id == payload.submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.status != "ACCEPTED":
        raise HTTPException(
            status_code=400,
            detail="Tips are only allowed after expert acceptance",
        )

    if payload.tipper_id == submission.contributor_id:
        raise HTTPException(
            status_code=400,
            detail="Contributors cannot tip their own submission",
        )

    tip = Tip(
        submission_id=submission.id,
        contributor_id=submission.contributor_id,
        tipper_id=payload.tipper_id,
        amount=round(payload.amount, 2),
        rating=payload.rating,
        currency=payload.currency,
        message=payload.message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(tip)

    audit = AuditEvent(
        actor_id=payload.tipper_id,
        entity_type="submission",
        entity_id=submission.id,
        action="tip_created",
        payload=json.dumps(
            {
                "amount": tip.amount,
                "currency": tip.currency,
                "rating": tip.rating,
            }
        ),
        created_at=datetime.now(timezone.utc),
        submission_id=submission.id,
    )
    db.add(audit)

    db.commit()
    db.refresh(tip)
    return tip


@router.get("/contributors/{contributor_id}", response_model=ContributorTipSummarySchema)
def contributor_tip_summary(contributor_id: str, db: Session = Depends(get_db)) -> dict[str, float | int | str | None]:
    totals = (
        db.query(
            func.count(Tip.id).label("total_tips"),
            func.coalesce(func.sum(Tip.amount), 0.0).label("total_amount"),
            func.avg(Tip.rating).label("average_rating"),
        )
        .filter(Tip.contributor_id == contributor_id)
        .one()
    )

    avg = float(totals.average_rating) if totals.average_rating is not None else None
    return {
        "contributor_id": contributor_id,
        "total_tips": int(totals.total_tips),
        "total_amount": round(float(totals.total_amount), 2),
        "average_rating": round(avg, 2) if avg is not None else None,
    }


@router.get("/recent", response_model=list[TipSchema])
def recent_tips(db: Session = Depends(get_db)) -> list[Tip]:
    return db.query(Tip).order_by(Tip.created_at.desc()).limit(20).all()
