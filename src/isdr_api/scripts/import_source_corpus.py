from __future__ import annotations

import argparse
from pathlib import Path

from isdr_api.database import SessionLocal
from isdr_api.source_ingestion import import_source_corpora


def main() -> None:
    parser = argparse.ArgumentParser(description="Import English-Luganda and Luganda source corpora")
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
        "--dry-run",
        action="store_true",
        help="Parse and validate without writing to the database",
    )

    args = parser.parse_args()
    english_luganda_path = Path(args.english_luganda)
    luganda_mono_path = Path(args.luganda_mono)

    if not english_luganda_path.exists():
        raise SystemExit(f"File not found: {english_luganda_path}")
    if not luganda_mono_path.exists():
        raise SystemExit(f"File not found: {luganda_mono_path}")

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

    mode = "DRY RUN" if args.dry_run else "WRITE"
    print(f"Import complete ({mode})")
    print(f"English sentences created: {stats.english_sentences_created}")
    print(f"Luganda sentences from pair file created: {stats.luganda_sentences_created}")
    print(f"Luganda monolingual sentences created: {stats.monolingual_luganda_created}")
    print(f"Source pairs created: {stats.source_pairs_created}")
    print(f"Source translation tasks created: {stats.source_translation_tasks_created}")
    print(f"Skipped duplicates: {stats.skipped_duplicates}")


if __name__ == "__main__":
    main()
