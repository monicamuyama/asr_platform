#!/usr/bin/env python3
"""Minimal test of SALT import logic"""
import sys
sys.path.insert(0, 'src')

from pathlib import Path
import csv
import uuid
from datetime import datetime, timezone
from isdr_api.database import SessionLocal
from isdr_api.db_models_extended import Language, SentenceCorpus

db = SessionLocal()
try:
    print("Testing SALT import with 100 sentences...")
    
    # Get English language
    english = db.query(Language).filter(Language.iso_code == "eng").first()
    print(f"✓ Found English language: {english.language_name}")
    
    # Read first 100 lines from english.csv
    file_path = Path("data/salt/english.csv")
    print(f"✓ Reading from {file_path}")
    
    created_count = 0
    skipped_count = 0
    batch_size = 25
    batch_counter = 0
    
    with file_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 100:
                break
                
            sentence_text = row.get("sentence_text", "").strip()
            if not sentence_text:
                continue
            
            # Check for duplicate
            existing = db.query(SentenceCorpus).filter(
                SentenceCorpus.language_id == english.id,
                SentenceCorpus.sentence_text == sentence_text,
            ).first()
            
            if existing:
                skipped_count += 1
            else:
                sentence = SentenceCorpus(
                    id=str(uuid.uuid4()),
                    language_id=english.id,
                    sentence_text=sentence_text,
                    domain="general",
                    source_type="salt_dataset",
                    is_verified=True,
                    created_by="test-import",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(sentence)
                created_count += 1
                batch_counter += 1
                
                if batch_counter % batch_size == 0:
                    print(f"  ... batch commit at {created_count} sentences")
                    db.commit()
                    batch_counter = 0
    
    # Final commit
    if batch_counter > 0:
        db.commit()
    
    print(f"✓ Import complete: {created_count} created, {skipped_count} skipped")
    
    # Verify
    count = db.query(SentenceCorpus).filter(
        SentenceCorpus.language_id == english.id,
        SentenceCorpus.source_type == "salt_dataset",
    ).count()
    print(f"✓ Verified: {count} SALT English sentences in database")
    
finally:
    db.close()
