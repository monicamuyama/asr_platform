"""Submissions router for handling contributor submissions and translations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from isdr_api.database import SessionLocal
from isdr_api.db_models import ContributorTranslation, Submission
from isdr_api.schemas_extended import (
    ContributorTranslationSchema,
    ContributorTranslationSubmitRequest,
    SubmissionCreateRequest,
    SubmissionResponse,
)

router = APIRouter(prefix="/submissions", tags=["submissions"])


def get_db() -> Session:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=SubmissionResponse)
def create_submission(
    payload: SubmissionCreateRequest,
    db: Session = Depends(get_db),
) -> Submission:
    """Create a new submission with optional transcription and translations.
    
    Contributors can provide:
    - Recording (audio_url)
    - Self-transcription (contributor_transcription)
    - Translations (source_language_code → target_language_code)
    
    Requirements for pool submission:
    - recording must be provided (audio_url)
    - transcription or translation must be provided
    """
    # Validate submission requirements
    if not payload.audio_url:
        raise HTTPException(
            status_code=400,
            detail="Recording (audio_url) is required for submission"
        )

    # Check if at least transcription or translation is provided
    has_transcription = bool(payload.contributor_transcription and payload.contributor_transcription.strip())
    has_translations = bool(payload.translations and len(payload.translations) > 0)
    
    if not (has_transcription or has_translations):
        raise HTTPException(
            status_code=400,
            detail="Transcription or at least one translation is required to submit"
        )

    # Create submission
    submission = Submission(
        id=str(uuid.uuid4()),
        contributor_id=payload.contributor_id,
        language_code=payload.language_code,
        native_language_code=payload.native_language_code,
        target_language_code=payload.target_language_code,
        mode=payload.mode,
        category=payload.category,
        speaker_profile=payload.speaker_profile,
        consent_version=payload.consent_version,
        hometown=payload.hometown,
        residence=payload.residence,
        tribe_ethnicity=payload.tribe_ethnicity,
        gender=payload.gender,
        age_group=payload.age_group,
        pair_group_id=payload.pair_group_id,
        riddle_part=payload.riddle_part,
        challenge_submission_id=payload.challenge_submission_id,
        reveal_submission_id=payload.reveal_submission_id,
        target_word=payload.target_word,
        read_prompt=payload.read_prompt,
        image_prompt_url=payload.image_prompt_url,
        spontaneous_instruction=payload.spontaneous_instruction,
        audio_url=payload.audio_url,
        cid=payload.cid or str(uuid.uuid4()),
        contributor_transcription=payload.contributor_transcription.strip() if payload.contributor_transcription else None,
        status="PENDING_COMMUNITY",
        created_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    db.flush()

    # Add translations if provided
    if payload.translations:
        for translation in payload.translations:
            contributor_translation = ContributorTranslation(
                id=str(uuid.uuid4()),
                submission_id=submission.id,
                source_language_code=translation.source_language_code.upper(),
                target_language_code=translation.target_language_code.upper(),
                source_text=translation.source_text.strip(),
                translated_text=translation.translated_text.strip(),
                translator_id=payload.contributor_id,
                status="submitted",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(contributor_translation)

    db.commit()
    db.refresh(submission)
    return submission


@router.get("", response_model=list[SubmissionResponse])
def list_submissions(
    contributor_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
) -> list[Submission]:
    """List submissions, optionally filtered by contributor or status."""
    query = db.query(Submission)

    if contributor_id:
        query = query.filter(Submission.contributor_id == contributor_id)

    if status:
        query = query.filter(Submission.status == status)

    return query.order_by(Submission.created_at.desc()).all()


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db),
) -> Submission:
    """Get a submission by ID."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return submission


@router.post("/{submission_id}/translations", response_model=ContributorTranslationSchema)
def add_translation(
    submission_id: str,
    payload: ContributorTranslationSubmitRequest,
    db: Session = Depends(get_db),
) -> ContributorTranslation:
    """Add or update a translation for a submission.
    
    Contributors can add translations to their own submissions after creation.
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Check if translation already exists for this language pair
    existing = (
        db.query(ContributorTranslation)
        .filter(
            ContributorTranslation.submission_id == submission_id,
            ContributorTranslation.source_language_code == payload.source_language_code.upper(),
            ContributorTranslation.target_language_code == payload.target_language_code.upper(),
        )
        .first()
    )

    if existing:
        # Update existing translation
        existing.source_text = payload.source_text.strip()
        existing.translated_text = payload.translated_text.strip()
        existing.status = "submitted"
        existing.updated_at = datetime.now(timezone.utc)
        translation = existing
    else:
        # Create new translation
        translation = ContributorTranslation(
            id=str(uuid.uuid4()),
            submission_id=submission_id,
            source_language_code=payload.source_language_code.upper(),
            target_language_code=payload.target_language_code.upper(),
            source_text=payload.source_text.strip(),
            translated_text=payload.translated_text.strip(),
            translator_id=submission.contributor_id,
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(translation)

    db.commit()
    db.refresh(translation)
    return translation


@router.get("/{submission_id}/translations", response_model=list[ContributorTranslationSchema])
def list_submission_translations(
    submission_id: str,
    db: Session = Depends(get_db),
) -> list[ContributorTranslation]:
    """List all translations for a submission."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    return (
        db.query(ContributorTranslation)
        .filter(ContributorTranslation.submission_id == submission_id)
        .order_by(ContributorTranslation.created_at.desc())
        .all()
    )
