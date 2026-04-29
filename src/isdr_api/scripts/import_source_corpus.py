from __future__ import annotations

import argparse
import time
from collections.abc import Callable
from pathlib import Path

from sqlalchemy.exc import OperationalError

from isdr_api.database import SessionLocal
from isdr_api.source_ingestion import (
    import_source_corpora,
    import_image_prompts,
    import_salt_sentences,
    import_translation_tasks,
)


def _run_with_retries(
    title: str,
    operation: Callable[[], None],
    retries: int = 3,
    backoff_seconds: float = 2.0,
) -> None:
    attempt = 1
    while True:
        try:
            operation()
            return
        except OperationalError as exc:
            if attempt >= retries:
                raise
            print(f"  Warning: {title} failed on attempt {attempt}/{retries}: {exc}")
            print("  Retrying with a fresh database session...")
            time.sleep(backoff_seconds * attempt)
            attempt += 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Import source corpora from multiple datasets")
    parser.add_argument(
        "--english-luganda",
        dest="english_luganda",
        default="data/English-Luganda.tsv",
        help="Path to English-Luganda TSV file",
    )
    parser.add_argument(
        "--luganda-mono",
        dest="luganda_mono",
        default="data/Luganda Monolingual Corpus.csv",
        help="Path to Luganda monolingual CSV file",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip importing existing English-Luganda and Luganda monolingual corpora",
    )
    parser.add_argument(
        "--skip-salt",
        action="store_true",
        help="Skip importing SALT dataset",
    )
    parser.add_argument(
        "--skip-images",
        action="store_true",
        help="Skip importing image prompts",
    )
    parser.add_argument(
        "--skip-translations",
        action="store_true",
        help="Skip importing translation tasks",
    )
    parser.add_argument(
        "--translation-limit",
        type=int,
        default=1000,
        help="Limit number of English sentences to create translation tasks for (default: 1000)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate without writing to the database",
    )

    args = parser.parse_args()
    english_luganda_path = Path(args.english_luganda)
    luganda_mono_path = Path(args.luganda_mono)

    if not args.skip_existing:
        if not english_luganda_path.exists():
            raise SystemExit(f"File not found: {english_luganda_path}")
        if not luganda_mono_path.exists():
            raise SystemExit(f"File not found: {luganda_mono_path}")

    print("=" * 70)
    print("CORPUS IMPORT ORCHESTRATION")
    print("=" * 70)

    if not args.skip_existing:
        print("\n[1/4] Importing English-Luganda pairs and Luganda monolingual...")

        def _run_existing() -> None:
            db = SessionLocal()
            try:
                stats = import_source_corpora(
                    db=db,
                    english_luganda_tsv=english_luganda_path,
                    luganda_monolingual_csv=luganda_mono_path,
                    dry_run=args.dry_run,
                )
            finally:
                db.close()

            print(f"  English sentences: {stats.english_sentences_created}")
            print(f"  Luganda from pairs: {stats.luganda_sentences_created}")
            print(f"  Luganda monolingual: {stats.monolingual_luganda_created}")
            print(f"  Source pairs: {stats.source_pairs_created}")

        _run_with_retries("existing corpus import", _run_existing)

    if not args.skip_salt:
        print("\n[2/4] Importing SALT dataset sentences...")

        def _run_salt() -> None:
            db = SessionLocal()
            try:
                salt_results = import_salt_sentences(db, dry_run=args.dry_run)
            finally:
                db.close()

            total_salt_created = sum(created for created, _ in salt_results.values())
            total_salt_skipped = sum(skipped for _, skipped in salt_results.values())
            print(f"  Total SALT created: {total_salt_created}")
            print(f"  Total SALT skipped: {total_salt_skipped}")

        _run_with_retries("SALT sentence import", _run_salt)

    if not args.skip_images:
        print("\n[3/4] Importing image prompts...")

        def _run_images() -> None:
            db = SessionLocal()
            try:
                image_created, image_skipped = import_image_prompts(db, dry_run=args.dry_run)
            finally:
                db.close()
            print(f"  Image prompts created: {image_created}")
            print(f"  Image prompts skipped: {image_skipped}")

        _run_with_retries("image prompt import", _run_images)

    if not args.skip_translations:
        print("\n[4/4] Creating translation tasks for non-SALT languages...")

        def _run_translations() -> None:
            db = SessionLocal()
            try:
                translation_results = import_translation_tasks(
                    db,
                    dry_run=args.dry_run,
                    limit=args.translation_limit,
                )
            finally:
                db.close()

            total_translation_tasks = sum(translation_results.values())
            print(f"  Total translation tasks queued: {total_translation_tasks}")

        _run_with_retries("translation task import", _run_translations)

    print("\n" + "=" * 70)
    mode = "DRY RUN" if args.dry_run else "WRITE"
    print(f"Import complete ({mode})")
    print("=" * 70)


if __name__ == "__main__":
    main()
