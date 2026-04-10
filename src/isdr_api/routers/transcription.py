from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models_extended import (
    Language,
    Recording,
    SentenceCorpus,
    TranslationTask,
    TranscriptionTask,
    TranscriptionValidation,
    User,
    UserLanguagePreference,
)
from isdr_api.language_matching import require_language_capability
from isdr_api.language_matching import list_language_matched_validator_ids
from isdr_api.schemas_extended import (
    GraduateTranscriptionRequest,
    PromptBankEntrySchema,
    TranslationQueueItemSchema,
    TranslationTaskCreateRequest,
    TranslationTaskSchema,
    TranscriptionQueueItemSchema,
    TranscriptionTaskCreateRequest,
    TranscriptionTaskSchema,
    TranscriptionValidationCreateRequest,
    TranscriptionValidationSchema,
)

router = APIRouter(prefix="/transcription", tags=["transcription"])


def _get_recording_or_404(db: Session, recording_id: str) -> Recording:
    recording = db.query(Recording).filter(Recording.id == recording_id).first()
    if recording is None:
        raise HTTPException(status_code=404, detail="Recording not found")
    return recording


def _latest_transcription_for_recording(db: Session, recording_id: str) -> TranscriptionTask | None:
    return (
        db.query(TranscriptionTask)
        .filter(TranscriptionTask.recording_id == recording_id)
        .order_by(TranscriptionTask.created_at.desc())
        .first()
    )


def _ensure_user_exists(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _ensure_user_language_capability(
    db: Session,
    user_id: str,
    language_id: str,
    capability: str,
) -> None:
    require_language_capability(db, user_id, language_id, capability)


@router.get("/queue", response_model=list[TranscriptionQueueItemSchema])
def list_transcription_queue(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    recordings = (
        db.query(Recording)
        .filter(Recording.status.in_(["pending_transcription", "new"]))
        .order_by(Recording.created_at.asc())
        .all()
    )

    queue_items: list[dict[str, object]] = []
    for recording in recordings:
        latest_task = _latest_transcription_for_recording(db, recording.id)
        transcript_count = (
            db.query(func.count(TranscriptionTask.id))
            .filter(TranscriptionTask.recording_id == recording.id)
            .scalar()
        )
        validation_count = 0
        if latest_task is not None:
            validation_count = (
                db.query(func.count(TranscriptionValidation.id))
                .filter(TranscriptionValidation.transcription_id == latest_task.id)
                .scalar()
            )

        prompt_text = recording.sentence.sentence_text if recording.sentence else None
        eligible_validator_ids = list_language_matched_validator_ids(db, recording.language_id)
        queue_items.append(
            {
                "id": recording.id,
                "recording_id": recording.id,
                "user_id": recording.user_id,
                "language_id": recording.language_id,
                "audio_url": recording.audio_url,
                "status": recording.status,
                "speaker_type": recording.speaker_type,
                "transcript_count": int(transcript_count or 0),
                "validation_count": int(validation_count or 0),
                "eligible_validator_ids": eligible_validator_ids,
                "eligible_validator_count": len(eligible_validator_ids),
                "latest_transcription": latest_task.transcribed_text if latest_task else None,
                "latest_confidence_score": latest_task.confidence_score if latest_task else None,
                "prompt_text": prompt_text,
            }
        )

    return queue_items


@router.post("/tasks", response_model=TranscriptionTaskSchema)
def upsert_transcription_task(payload: TranscriptionTaskCreateRequest, db: Session = Depends(get_db)) -> TranscriptionTask:
    recording = _get_recording_or_404(db, payload.recording_id)
    _ensure_user_exists(db, payload.transcriber_id)
    _ensure_user_language_capability(db, payload.transcriber_id, recording.language_id, "transcribe")

    task = (
        db.query(TranscriptionTask)
        .filter(
            TranscriptionTask.recording_id == payload.recording_id,
            TranscriptionTask.transcriber_id == payload.transcriber_id,
        )
        .first()
    )

    if task is None:
        task = TranscriptionTask(
            id=str(uuid.uuid4()),
            recording_id=payload.recording_id,
            transcriber_id=payload.transcriber_id,
            transcribed_text=payload.transcribed_text,
            confidence_score=payload.confidence_score,
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(task)
    else:
        task.transcribed_text = payload.transcribed_text
        task.confidence_score = payload.confidence_score
        task.status = "submitted"
        task.updated_at = datetime.now(timezone.utc)

    recording.status = "transcribed"
    recording.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.get("/tasks/{task_id}", response_model=TranscriptionTaskSchema)
def get_transcription_task(task_id: str, db: Session = Depends(get_db)) -> TranscriptionTask:
    task = db.query(TranscriptionTask).filter(TranscriptionTask.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Transcription task not found")
    return task


@router.post("/tasks/{task_id}/validations", response_model=TranscriptionValidationSchema)
def create_transcription_validation(
    task_id: str,
    payload: TranscriptionValidationCreateRequest,
    db: Session = Depends(get_db),
) -> TranscriptionValidation:
    task = db.query(TranscriptionTask).filter(TranscriptionTask.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Transcription task not found")
    recording = _get_recording_or_404(db, task.recording_id)
    _ensure_user_exists(db, payload.validator_id)
    _ensure_user_language_capability(db, payload.validator_id, recording.language_id, "validate")

    validation_comments = payload.comments or ""
    if payload.deep_cultural_meaning:
        context_note = f"Deep cultural meaning: {payload.deep_cultural_meaning}"
        validation_comments = f"{validation_comments}\n{context_note}".strip()

    validation = TranscriptionValidation(
        id=str(uuid.uuid4()),
        transcription_id=task.id,
        validator_id=payload.validator_id,
        rating=payload.rating,
        is_correct=payload.is_correct,
        suggested_correction=payload.suggested_correction,
        comments=validation_comments or None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(validation)
    task.status = "under_review"
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(validation)
    return validation


@router.post("/tasks/{task_id}/graduate", response_model=PromptBankEntrySchema)
def graduate_transcription_task(
    task_id: str,
    payload: GraduateTranscriptionRequest,
    db: Session = Depends(get_db),
) -> SentenceCorpus:
    expert = _ensure_user_exists(db, payload.expert_id)
    if expert.role not in {"expert", "admin"}:
        raise HTTPException(status_code=403, detail="Only expert or admin users can graduate transcriptions")

    task = db.query(TranscriptionTask).filter(TranscriptionTask.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Transcription task not found")

    recording = _get_recording_or_404(db, task.recording_id)
    validations = (
        db.query(TranscriptionValidation)
        .filter(TranscriptionValidation.transcription_id == task.id)
        .order_by(TranscriptionValidation.created_at.asc())
        .all()
    )
    if not validations:
        raise HTTPException(status_code=400, detail="At least one peer validation is required before graduation")

    average_rating = sum(validation.rating for validation in validations) / len(validations)
    if average_rating < 4 or not any(validation.is_correct for validation in validations):
        raise HTTPException(status_code=400, detail="Transcription has not met the graduation threshold")

    translations = (
        db.query(TranslationTask)
        .filter(TranslationTask.transcription_id == task.id)
        .order_by(TranslationTask.updated_at.desc())
        .all()
    )
    if not translations:
        raise HTTPException(status_code=400, detail="At least one translation is required before graduation")

    existing_entry = (
        db.query(SentenceCorpus)
        .filter(
            SentenceCorpus.language_id == recording.language_id,
            SentenceCorpus.sentence_text == task.transcribed_text,
        )
        .first()
    )
    if existing_entry is None:
        existing_entry = SentenceCorpus(
            id=str(uuid.uuid4()),
            language_id=recording.language_id,
            dialect_id=recording.dialect_id,
            sentence_text=task.transcribed_text,
            domain="community",
            source_type="prompt_bank",
            is_verified=True,
            created_by=recording.user_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(existing_entry)
    else:
        existing_entry.is_verified = True

    recording.sentence_id = existing_entry.id
    recording.status = "graduated"
    recording.updated_at = datetime.now(timezone.utc)
    task.status = "graduated"
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(existing_entry)
    return existing_entry


@router.get("/prompt-bank", response_model=list[PromptBankEntrySchema])
def list_prompt_bank(db: Session = Depends(get_db)) -> list[SentenceCorpus]:
    return (
        db.query(SentenceCorpus)
        .filter(SentenceCorpus.is_verified)
        .order_by(SentenceCorpus.created_at.desc())
        .all()
    )


@router.get("/translation-queue", response_model=list[TranslationQueueItemSchema])
def list_translation_queue(db: Session = Depends(get_db)) -> list[dict[str, object]]:
    tasks = (
        db.query(TranscriptionTask)
        .filter(TranscriptionTask.status.in_(["submitted", "under_review", "translated"]))
        .order_by(TranscriptionTask.updated_at.desc())
        .all()
    )

    queue_items: list[dict[str, object]] = []
    for task in tasks:
        translation_count = (
            db.query(func.count(TranslationTask.id))
            .filter(TranslationTask.transcription_id == task.id)
            .scalar()
        )
        latest_translation = (
            db.query(TranslationTask)
            .filter(TranslationTask.transcription_id == task.id)
            .order_by(TranslationTask.updated_at.desc())
            .first()
        )
        queue_items.append(
            {
                "transcription_id": task.id,
                "recording_id": task.recording_id,
                "source_language_id": task.recording.language_id,
                "transcribed_text": task.transcribed_text,
                "translation_count": int(translation_count or 0),
                "latest_translation": latest_translation.translated_text if latest_translation else None,
            }
        )

    return queue_items


@router.post("/tasks/{task_id}/translations", response_model=TranslationTaskSchema)
def create_or_update_translation_task(
    task_id: str,
    payload: TranslationTaskCreateRequest,
    db: Session = Depends(get_db),
) -> TranslationTask:
    task = db.query(TranscriptionTask).filter(TranscriptionTask.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Transcription task not found")
    if payload.transcription_id != task_id:
        raise HTTPException(status_code=400, detail="transcription_id must match task path id")

    _ensure_user_exists(db, payload.translator_id)

    translation = (
        db.query(TranslationTask)
        .filter(
            TranslationTask.transcription_id == task.id,
            TranslationTask.translator_id == payload.translator_id,
            TranslationTask.target_language_code == payload.target_language_code.upper(),
        )
        .first()
    )

    if translation is None:
        translation = TranslationTask(
            id=str(uuid.uuid4()),
            transcription_id=task.id,
            translator_id=payload.translator_id,
            target_language_code=payload.target_language_code.upper(),
            translated_text=payload.translated_text,
            status="submitted",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(translation)
    else:
        translation.translated_text = payload.translated_text
        translation.status = "submitted"
        translation.updated_at = datetime.now(timezone.utc)

    task.status = "translated"
    task.updated_at = datetime.now(timezone.utc)
    task.recording.status = "translated"
    task.recording.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(translation)
    return translation
