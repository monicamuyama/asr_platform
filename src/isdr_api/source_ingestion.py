from __future__ import annotations

import csv
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, text
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
    salt_sentences_created: int = 0
    salt_duplicates_skipped: int = 0
    image_prompts_created: int = 0
    image_prompts_skipped: int = 0
    translation_tasks_queued: int = 0
    translation_tasks_skipped: int = 0


def _normalize_text(text: str) -> str:
    return " ".join(text.strip().split())


def _get_language_or_raise(db: Session, iso_code: str) -> Language:
    language = db.query(Language).filter(func.lower(Language.iso_code) == iso_code.lower()).first()
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
    existing_sentence_texts: set[str] | None = None,
) -> tuple[SentenceCorpus | None, bool]:
    normalized_text = _normalize_text(sentence_text)
    if not normalized_text:
        return None, False

    if existing_sentence_texts is not None:
        if normalized_text in existing_sentence_texts:
            return None, False
    else:
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
    if existing_sentence_texts is not None:
        existing_sentence_texts.add(normalized_text)
    return sentence, True


def _create_source_pair_if_missing(
    db: Session,
    target_sentence_id: str,
    source_language_id: str,
    target_language_id: str,
    source_dataset: str,
    source_row_number: int | None,
    dry_run: bool,
    existing_pairs: set[tuple[str, str]] | None = None,
) -> bool:
    pair_key = (source_sentence_id, target_sentence_id)
    if existing_pairs is not None:
        if pair_key in existing_pairs:
            return False
    else:
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
    if existing_pairs is not None:
        existing_pairs.add(pair_key)
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
    existing_tasks: set[tuple[str, str]] | None = None,
) -> bool:
    task_key = (source_sentence_id, target_language.id)
    if existing_tasks is not None:
        if task_key in existing_tasks:
            return False
    else:
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
    if existing_tasks is not None:
        existing_tasks.add(task_key)
    return True


def import_salt_sentences(db: Session, dry_run: bool = False) -> dict[str, tuple[int, int]]:
    """
    Import SALT dataset sentences from data/salt/ CSVs.
    
    Returns dict mapping language_name -> (created, skipped).
    """
    salt_data_dir = Path("data/salt")
    if not salt_data_dir.exists():
        return {}
    
    # Map filenames to ISO codes
    filename_to_iso = {
        "english.csv": "eng",
        "acholi.csv": "ach",
        "ateso.csv": "teo",
        "lugbara.csv": "lgg",
        "luganda.csv": "lug",
        "runyankole.csv": "nyn",
        "swahili.csv": "swa",
        "rutooro.csv": "ttj",
        "lusoga.csv": "xog",
    }
    
    results = {}
    batch_size = 500  # Commit every 500 sentences
    
    # Preload all SALT language sentences using raw SQL (much faster than ORM)
    print("  Preloading existing SALT sentences...")
    iso_to_language = {}
    iso_to_existing_texts = {}
    for filename, iso_code in filename_to_iso.items():
        language = _get_language_or_raise(db, iso_code)
        iso_to_language[iso_code] = language
        
        rows = db.execute(
            text("SELECT sentence_text FROM sentence_corpus WHERE language_id = :lang_id AND source_type = :source_type"),
            {"lang_id": str(language.id), "source_type": "salt_dataset"}
        ).fetchall()
        iso_to_existing_texts[iso_code] = {
            _normalize_text(sentence_text)
            for (sentence_text,) in rows
        }
    print(f"  Preload complete: {sum(len(texts) for texts in iso_to_existing_texts.values())} SALT sentences in cache")
    
    for filename, iso_code in filename_to_iso.items():
        file_path = salt_data_dir / filename
        if not file_path.exists():
            continue
        
        language = iso_to_language[iso_code]
        existing_sentence_texts = iso_to_existing_texts[iso_code]
        created_count = 0
        skipped_count = 0
        batch_counter = 0
        
        print(f"  Processing {language.language_name} ({iso_code})...")
        
        with file_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                if not row or "sentence_text" not in row:
                    continue
                
                sentence_text = _normalize_text(row["sentence_text"])
                if not sentence_text:
                    continue
                
                if sentence_text in existing_sentence_texts:
                    skipped_count += 1
                elif not dry_run:
                    sentence = SentenceCorpus(
                        id=str(uuid.uuid4()),
                        language_id=language.id,
                        sentence_text=sentence_text,
                        domain="general",
                        source_type="salt_dataset",
                        is_verified=True,
                        created_by="system-import-salt",
                        created_at=datetime.now(timezone.utc),
                    )
                    db.add(sentence)
                    existing_sentence_texts.add(sentence_text)
                    created_count += 1
                    batch_counter += 1
                    
                    # Batch commit
                    if batch_counter % batch_size == 0:
                        db.commit()
                        print(f"    ... {created_count} sentences imported")
                else:
                    created_count += 1
                    batch_counter += 1
        
        # Final commit for this language
        if not dry_run and batch_counter > 0:
            db.commit()
        
        results[language.language_name] = (created_count, skipped_count)
        print(f"    ✓ {language.language_name}: {created_count} created, {skipped_count} skipped")
    
    return results


def import_image_prompts(db: Session, dry_run: bool = False) -> tuple[int, int]:
    """
    Import image prompt sentences for all languages.
    
    Returns (total_created, total_skipped).
    """
    image_urls_path = Path("data/recorded - image urls.csv")
    if not image_urls_path.exists():
        return 0, 0
    
    # Standard prompt text for image descriptions
    standard_prompt = "Describe what you see in this image"
    sentence_corpus_columns = set(SentenceCorpus.__table__.columns.keys())

    print("  Preloading existing image prompts...")
    existing_image_urls = {
        _normalize_text(image_prompt_url)
        for (image_prompt_url,) in db.execute(
            text(
                "SELECT image_prompt_url FROM sentence_corpus "
                "WHERE source_type = :source_type AND image_prompt_url IS NOT NULL"
            ),
            {"source_type": "image_prompt"},
        ).fetchall()
    }
    print(f"  Preload complete: {len(existing_image_urls)} existing image prompts")

    created_count = 0
    skipped_count = 0

    print("  Reading image URLs and creating prompts...")
    with image_urls_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row_index, row in enumerate(reader, start=1):
            image_url = _normalize_text(row.get("image_url", ""))
            if not image_url:
                continue

            if image_url in existing_image_urls:
                skipped_count += 1
                continue

            if dry_run:
                created_count += 1
                continue

            sentence_kwargs = {
                "id": str(uuid.uuid4()),
                "language_id": None,
                "sentence_text": standard_prompt,
                "domain": "general",
                "source_type": "image_prompt",
                "is_verified": True,
                "created_by": "system-import-images",
                "created_at": datetime.now(timezone.utc),
            }

            if "image_prompt_url" in sentence_corpus_columns:
                sentence_kwargs["image_prompt_url"] = image_url
            elif "image_url" in sentence_corpus_columns:
                sentence_kwargs["image_url"] = image_url
            else:
                sentence_kwargs["sentence_text"] = f"{standard_prompt}|{image_url}"

            db.add(SentenceCorpus(**sentence_kwargs))
            db.flush()
            existing_image_urls.add(image_url)
            created_count += 1

            if row_index % 100 == 0:
                print(f"    ... {created_count} image prompts created")

    if not dry_run:
        db.commit()

    print(f"  Image prompts: {created_count} created, {skipped_count} skipped")
    return created_count, skipped_count


def import_translation_tasks(db: Session, dry_run: bool = False, limit: int = 1000) -> dict[str, int]:
    """
    Create translation tasks for English SALT sentences into non-SALT languages.
    
    Returns dict mapping language_name -> count.
    """
    # Languages in SALT
    salt_language_codes = {"ach", "teo", "lgg", "nyn", "swa", "eng", "lug", "ttj", "xog"}
    
    # Non-SALT Uganda languages that need translation tasks
    non_salt_iso_codes = [
        "cgg",  # Rukiga
        "nyo",  # Runyoro
        "myx",  # Lumasaba
        "lsm",  # Lusamia
        "gwr",  # Lugwere
        "nuj",  # Lunyole
        "laj",  # Lango
        "kdi",  # Kumam
        "keo",  # Kakwa
        "alz",  # Alur
        "adh",  # Adhola
        "kdj",  # Karamojong
        "mhi",  # Madi
        "ari",  # Aringa
        "kpz",  # Kupsabiny
    ]
    
    # Get English language
    english = _get_language_or_raise(db, "eng")
    
    # Get target languages
    target_languages = {}
    for iso_code in non_salt_iso_codes:
        try:
            lang = _get_language_or_raise(db, iso_code)
            target_languages[iso_code] = lang
        except ValueError:
            # Language not in database, skip
            pass
    
    if not target_languages:
        return {}

    # Preload existing tasks using raw SQL (much faster)
    print("  Preloading existing translation tasks...")
    existing_tasks = {
        (source_id, target_lang_id)
        for source_id, target_lang_id in db.execute(
            text("SELECT source_sentence_id, target_language_id FROM source_translation_tasks")
        ).fetchall()
    }
    print(f"  Existing tasks cache: {len(existing_tasks)} tasks")
    
    # Get English SALT sentences using raw SQL (faster than ORM)
    print(f"  Fetching first {limit} English SALT sentences...")
    english_rows = db.execute(
        text("SELECT id FROM sentence_corpus WHERE language_id = :lang_id AND source_type = :source_type LIMIT :limit"),
        {"lang_id": str(english.id), "source_type": "salt_dataset", "limit": limit}
    ).fetchall()
    english_sentence_ids = [row[0] for row in english_rows]
    print(f"  Found {len(english_sentence_ids)} English SALT sentences")
    
    results = {}
    
    for target_iso_code, target_language in target_languages.items():
        created_count = 0
        
        for source_sentence_id in english_sentence_ids:
            created_task = _create_source_translation_task_if_missing(
                db,
                source_sentence_id=source_sentence_id,
                source_language_id=english.id,
                target_language=target_language,
                machine_prefill_text=None,
                prefill_provider=None,
                prefill_confidence=None,
                dry_run=dry_run,
                existing_tasks=existing_tasks,
            )
            
            if created_task:
                created_count += 1
        
        results[target_language.language_name] = created_count
        print(f"  {target_language.language_name} ({target_iso_code}): {created_count} tasks queued")
    
    if not dry_run:
        db.commit()
    
    return results


def import_source_corpora(
    db: Session,
    english_luganda_tsv: Path,
    luganda_monolingual_csv: Path,
    dry_run: bool = False,
) -> IngestionStats:
    stats = IngestionStats()

    english = _get_language_or_raise(db, "eng")
    luganda = _get_language_or_raise(db, "lug")

    print("  Preloading existing English and Luganda sentence caches...")

    # Use raw SQL for faster preload (avoids ORM object hydration)
    english_rows = db.execute(
        text("SELECT id, sentence_text FROM sentence_corpus WHERE language_id = :lang_id"),
        {"lang_id": str(english.id)}
    ).fetchall()
    existing_english_sentence_ids = {
        _normalize_text(sentence_text): sentence_id
        for sentence_id, sentence_text in english_rows
    }
    
    luganda_rows = db.execute(
        text("SELECT id, sentence_text FROM sentence_corpus WHERE language_id = :lang_id"),
        {"lang_id": str(luganda.id)}
    ).fetchall()
    existing_luganda_sentence_ids = {
        _normalize_text(sentence_text): sentence_id
        for sentence_id, sentence_text in luganda_rows
    }
    
    existing_english_sentences = set(existing_english_sentence_ids.keys())
    existing_luganda_sentences = set(existing_luganda_sentence_ids.keys())
    
    pair_rows = db.execute(
        text("SELECT source_sentence_id, target_sentence_id FROM source_sentence_pairs")
    ).fetchall()
    existing_pairs = {
        (source_id, target_id)
        for source_id, target_id in pair_rows
    }
    print(
        f"  Cache ready: {len(existing_english_sentences)} English, {len(existing_luganda_sentences)} Luganda, {len(existing_pairs)} existing pairs"
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
                existing_sentence_texts=existing_english_sentences,
            )
            luganda_sentence, luganda_created = _get_or_create_sentence(
                db,
                language_id=luganda.id,
                sentence_text=luganda_text,
                source_type="source_parallel",
                domain="general",
                created_by="system-import",
                dry_run=dry_run,
                existing_sentence_texts=existing_luganda_sentences,
            )

            if english_created:
                stats.english_sentences_created += 1
            if luganda_created:
                stats.luganda_sentences_created += 1
            if not english_created and not luganda_created:
                stats.skipped_duplicates += 1

            if not dry_run:
                english_sentence_id = (
                    english_sentence.id
                    if english_sentence is not None
                    else existing_english_sentence_ids.get(english_text)
                )
                luganda_sentence_id = (
                    luganda_sentence.id
                    if luganda_sentence is not None
                    else existing_luganda_sentence_ids.get(luganda_text)
                )

                if english_created and english_sentence is not None:
                    existing_english_sentence_ids[english_text] = english_sentence.id
                if luganda_created and luganda_sentence is not None:
                    existing_luganda_sentence_ids[luganda_text] = luganda_sentence.id

                if english_sentence_id is None or luganda_sentence_id is None:
                    continue

                if _create_source_pair_if_missing(
                    db,
                    source_sentence_id=english_sentence_id,
                    target_sentence_id=luganda_sentence_id,
                    source_language_id=english.id,
                    target_language_id=luganda.id,
                    source_dataset="english_luganda",
                    source_row_number=row_number,
                    dry_run=False,
                    existing_pairs=existing_pairs,
                ):
                    stats.source_pairs_created += 1

            if row_number % 100 == 0:
                print(f"  Processed {row_number} English-Luganda rows...")

            if not dry_run and row_number % 250 == 0:
                db.commit()

    with luganda_monolingual_csv.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        for row_number, row in enumerate(reader, start=1):
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
                existing_sentence_texts=existing_luganda_sentences,
            )
            if created:
                stats.monolingual_luganda_created += 1
            else:
                stats.skipped_duplicates += 1

            if row_number % 100 == 0:
                print(f"  Processed {row_number} Luganda monolingual rows...")

            if not dry_run and row_number % 1000 == 0:
                db.commit()

    if not dry_run:
        db.commit()

    return stats
