#!/usr/bin/env python3
import os
import sys
import time

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from isdr_api.database import SessionLocal
from isdr_api.db_models_extended import SentenceCorpus, Language

def main():
    db = SessionLocal()
    
    # Get language IDs
    eng = db.query(Language).filter(Language.iso_code == "eng").first()
    lug = db.query(Language).filter(Language.iso_code == "lug").first()
    
    print(f"English ID: {eng.id if eng else 'NOT FOUND'}")
    print(f"Luganda ID: {lug.id if lug else 'NOT FOUND'}")
    
    # Test the count first
    print("\nCounting English sentences...")
    start = time.time()
    count_eng = db.query(SentenceCorpus).filter(SentenceCorpus.language_id == eng.id).count()
    elapsed = time.time() - start
    print(f"English count: {count_eng} ({elapsed:.2f}s)")
    
    print("Counting Luganda sentences...")
    start = time.time()
    count_lug = db.query(SentenceCorpus).filter(SentenceCorpus.language_id == lug.id).count()
    elapsed = time.time() - start
    print(f"Luganda count: {count_lug} ({elapsed:.2f}s)")
    
    print("\nPreloading English sentences...")
    start = time.time()
    english_data = [(s.id, s.sentence_text) for s in db.query(SentenceCorpus).filter(SentenceCorpus.language_id == eng.id).all()]
    elapsed = time.time() - start
    print(f"Preloaded {len(english_data)} English sentences in {elapsed:.2f}s")
    
    print("\nPreloading Luganda sentences...")
    start = time.time()
    luganda_data = [(s.id, s.sentence_text) for s in db.query(SentenceCorpus).filter(SentenceCorpus.language_id == lug.id).all()]
    elapsed = time.time() - start
    print(f"Preloaded {len(luganda_data)} Luganda sentences in {elapsed:.2f}s")
    
    db.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
