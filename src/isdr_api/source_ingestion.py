from __future__ import annotations

import csv
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from isdr_api.db_models_extended import Language, SentenceCorpus, SourceSentencePair, SourceTranslationTask


@dataclass
class IngestionStats:
    english_sentences_created: int = 0
    luganda_sentences_created: int = 0
    monolingual_luganda_created: int = 0
    source_pairs_created: int = 0
    source_translation_tasks_created: int = 0
    skipped_duplicates: int = 0


def _normalize_text(text: str) -> str:
    return " ".join(text.strip().split())


def _get_language_or_raise(db: Session, iso_code: str) -> Language:
    language = db.query(Language).filter(Language.iso_code == iso_code.upper()).first()
    if language is None:
        raise ValueError(f"Language with ISO code '{iso_code}' was not found")
    return language


def _get_or_create_sentence(
    db: Session,
    language_id: str,
    sentence_text: str,
    source_type: str,
    domain: str,
    created_by: str,
    dry_run: bool,
) -> tuple[SentenceCorpus | None, bool]:
    normalized_text = _normalize_text(sentence_text)
    if not normalized_text:
        return None, False

    existing = (
        db.query(SentenceCorpus)
        .filter(
            SentenceCorpus.language_id == language_id,
            SentenceCorpus.sentence_text == normalized_text,
        )
        .first()
    )
    if existing is not None:
        return existing, False

    if dry_run:
        return None, True

    sentence = SentenceCorpus(
        id=str(uuid.uuid4()),
        language_id=language_id,
        sentence_text=normalized_text,
        domain=domain,
        source_type=source_type,
        is_verified=True,
        created_by=created_by,
        created_at=datetime.now(timezone.utc),
    )
    db.add(sentence)
    db.flush()
    return sentence, True


def _create_source_pair_if_missing(
    db: Session,
    source_sentence_id: str,
    target_sentence_id: str,
    source_language_id: str,
    target_language_id: str,
    source_dataset: str,
    source_row_number: int | None,
    dry_run: bool,
) -> bool:
    existing = (
        db.query(SourceSentencePair)
        .filter(
            SourceSentencePair.source_sentence_id == source_sentence_id,
            SourceSentencePair.target_sentence_id == target_sentence_id,
        )
        .first()
    )
    if existing is not None:
        return False

    if dry_run:
        return True

    db.add(
        SourceSentencePair(
            id=str(uuid.uuid4()),
            source_sentence_id=source_sentence_id,
            target_sentence_id=target_sentence_id,
            source_language_id=source_language_id,
            target_language_id=target_language_id,
            source_dataset=source_dataset,
            source_row_number=source_row_number,
            created_at=datetime.now(timezone.utc),
        )
    )
    return True


def _create_source_translation_task_if_missing(
    db: Session,
    source_sentence_id: str,
    source_language_id: str,
    target_language: Language,
    machine_prefill_text: str | None,
    prefill_provider: str | None,
    prefill_confidence: float | None,
    dry_run: bool,
) -> bool:
    existing = (
        db.query(SourceTranslationTask)
        .filter(
            SourceTranslationTask.source_sentence_id == source_sentence_id,
            SourceTranslationTask.target_language_id == target_language.id,
        )
        .first()
    )
    if existing is not None:
        return False

    if dry_run:
        return True

    db.add(
        SourceTranslationTask(
            id=str(uuid.uuid4()),
            source_sentence_id=source_sentence_id,
            source_language_id=source_language_id,
            target_language_id=target_language.id,
            machine_prefill_text=machine_prefill_text,
            prefill_provider=prefill_provider,
            prefill_confidence=prefill_confidence,
            status="prefilled" if machine_prefill_text else "queued",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
    )
    return True


def import_source_corpora(
    db: Session,
    english_luganda_tsv: Path,
    luganda_monolingual_csv: Path,
    dry_run: bool = False,
) -> IngestionStats:
    stats = IngestionStats()

    english = _get_language_or_raise(db, "ENG")
    luganda = _get_language_or_raise(db, "LG")
    target_languages = (
        db.query(Language)
        .filter(Language.id != english.id)
        .order_by(Language.language_name.asc())
        .all()
    )

    with english_luganda_tsv.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle, delimiter="\t")
        for row_number, row in enumerate(reader, start=1):
            if len(row) < 2:
                continue
            english_text = _normalize_text(row[0])
            luganda_text = _normalize_text(row[1])
            if not english_text or not luganda_text:
                continue

            english_sentence, english_created = _get_or_create_sentence(
                db,
                language_id=english.id,
                sentence_text=english_text,
                source_type="source_parallel",
                domain="general",
                created_by="system-import",
                dry_run=dry_run,
            )
            luganda_sentence, luganda_created = _get_or_create_sentence(
                db,
                language_id=luganda.id,
                sentence_text=luganda_text,
                source_type="source_parallel",
                domain="general",
                created_by="system-import",
                dry_run=dry_run,
            )

            if english_created:
                stats.english_sentences_created += 1
            if luganda_created:
                stats.luganda_sentences_created += 1
            if not english_created and not luganda_created:
                stats.skipped_duplicates += 1

            if not dry_run:
                assert english_sentence is not None
                assert luganda_sentence is not None
                if _create_source_pair_if_missing(
                    db,
                    source_sentence_id=english_sentence.id,
                    target_sentence_id=luganda_sentence.id,
                    source_language_id=english.id,
                    target_language_id=luganda.id,
                    source_dataset="english_luganda",
                    source_row_number=row_number,
                    dry_run=False,
                ):
                    stats.source_pairs_created += 1

                for target_language in target_languages:
                    machine_prefill_text = None
                    prefill_provider = None
                    prefill_confidence = None
                    if target_language.id == luganda.id:
                        machine_prefill_text = luganda_sentence.sentence_text
                        prefill_provider = "parallel_seed"
                        prefill_confidence = 0.95

                    created_task = _create_source_translation_task_if_missing(
                        db,
                        source_sentence_id=english_sentence.id,
                        source_language_id=english.id,
                        target_language=target_language,
                        machine_prefill_text=machine_prefill_text,
                        prefill_provider=prefill_provider,
                        prefill_confidence=prefill_confidence,
                        dry_run=False,
                    )
                    if created_task:
                        stats.source_translation_tasks_created += 1

    with luganda_monolingual_csv.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue
            luganda_text = _normalize_text(row[0])
            if not luganda_text:
                continue

            _, created = _get_or_create_sentence(
                db,
                language_id=luganda.id,
                sentence_text=luganda_text,
                source_type="source_monolingual",
                domain="general",
                created_by="system-import",
                dry_run=dry_run,
            )
            if created:
                stats.monolingual_luganda_created += 1
            else:
                stats.skipped_duplicates += 1

    if not dry_run:
        db.commit()

    return stats
