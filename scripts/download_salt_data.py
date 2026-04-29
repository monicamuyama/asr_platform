#!/usr/bin/env python3
"""
Download SALT dataset from HuggingFace and save as separate language CSVs.

Downloads ALL sentences from train + dev + test splits and saves each language
as a separate CSV in data/salt/ with a single 'sentence_text' column.

Usage:
  python scripts/download_salt_data.py

Requires:
  pip install datasets
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

try:
    from datasets import load_dataset, concatenate_datasets
except ImportError:
    print("ERROR: datasets library not installed")
    print("Please run: pip install datasets")
    sys.exit(1)


def main() -> None:
    print("=" * 70)
    print("SALT Dataset Download (ALL sentences)")
    print("=" * 70)

    # Create output directory
    output_dir = Path("data/salt")
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir.resolve()}")

    # Load SALT dataset from HuggingFace - all splits
    print("\nLoading SALT dataset from HuggingFace...")
    try:
        train_dataset = load_dataset("Sunbird/salt", "text-all", split="train")
        dev_dataset = load_dataset("Sunbird/salt", "text-all", split="dev")
        test_dataset = load_dataset("Sunbird/salt", "text-all", split="test")
        
        # Combine all splits
        dataset = concatenate_datasets([train_dataset, dev_dataset, test_dataset])
    except Exception as e:
        print(f"ERROR: Failed to load SALT dataset: {e}")
        print("Make sure you have internet connection and datasets library installed")
        sys.exit(1)

    print(f"Dataset loaded: {len(dataset)} total rows (combined train+dev+test)")
    
    # Inspect the dataset structure
    print(f"\nDataset columns: {dataset.column_names}")
    if len(dataset) > 0:
        print(f"First row sample:\n  {dataset[0]}")
    
    # Map language column names in SALT to output filenames
    language_columns = {
        "eng_source_text": "english.csv",
        "ach_text": "acholi.csv",
        "teo_text": "ateso.csv",
        "lgg_text": "lugbara.csv",
        "lug_text": "luganda.csv",
        "nyn_text": "runyankole.csv",
        "swa_text": "swahili.csv",
        "ttj_text": "rutooro.csv",
        "xog_text": "lusoga.csv",
    }
    
    # Verify columns exist and filter
    found_columns = {}
    for lang_col, filename in language_columns.items():
        if lang_col in dataset.column_names:
            found_columns[lang_col] = filename
        else:
            print(f"  Warning: Column '{lang_col}' not found in dataset")
    
    if not found_columns:
        print("ERROR: No language columns found in dataset")
        print(f"Available columns: {dataset.column_names}")
        sys.exit(1)

    print(f"\nProcessing {len(found_columns)} language columns...")

    # Process each language
    total_results = {}
    
    for lang_col, output_filename in found_columns.items():
        output_path = output_dir / output_filename
        created_count = 0

        print(f"\n  Processing {lang_col}...")

        with output_path.open("w", encoding="utf-8", newline="") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=["sentence_text"])
            writer.writeheader()

            for i, row in enumerate(dataset):
                sentence_text = row.get(lang_col)
                
                # Filter out empty/null/whitespace-only rows
                if sentence_text and isinstance(sentence_text, str):
                    sentence_text = sentence_text.strip()
                    if sentence_text:
                        writer.writerow({"sentence_text": sentence_text})
                        created_count += 1

                # Progress indicator
                if (i + 1) % 5000 == 0:
                    print(f"    Progress: {i + 1} rows processed...")

        total_results[lang_col] = created_count
        print(f"    ✓ Saved {created_count} sentences to {output_filename}")

    print("\n" + "=" * 70)
    print("Download Summary")
    print("=" * 70)
    
    for lang_col, count in total_results.items():
        filename = found_columns[lang_col]
        print(f"  {filename:<20} {count:>7} sentences")
    
    total_all = sum(total_results.values())
    print(f"  {'TOTAL':<20} {total_all:>7} sentences")

    print("\n" + "=" * 70)
    print("Download complete!")
    print("=" * 70)
    print("\nNext step: Run import script")
    print("  export PYTHONPATH=src")
    print("  python -m isdr_api.scripts.import_source_corpus")


if __name__ == "__main__":
    main()
