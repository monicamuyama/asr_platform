#!/usr/bin/env python3
"""Quick test of import functions"""
import sys
sys.path.insert(0, 'src')

from isdr_api.database import SessionLocal
from isdr_api.db_models_extended import Language

print("Testing database connection...")
db = SessionLocal()
try:
    languages = db.query(Language).limit(5).all()
    print(f"✓ Connected! Found {len(languages)} languages")
    for lang in languages:
        print(f"  - {lang.language_name} ({lang.iso_code})")
    
    # Check for SALT languages
    salt_codes = ["eng", "ach", "teo", "lgg", "lug", "nyn", "swa", "ttj", "xog"]
    for code in salt_codes:
        lang = db.query(Language).filter(Language.iso_code == code).first()
        if lang:
            print(f"  ✓ {code} -> {lang.language_name}")
        else:
            print(f"  ✗ {code} NOT FOUND")
            
finally:
    db.close()
    
print("\nTesting SALT file reading...")
from pathlib import Path
import csv

salt_files = ["english", "acholi", "ateso", "lugbara", "luganda", "runyankole", "swahili", "rutooro", "lusoga"]
for filename in salt_files:
    path = Path(f"data/salt/{filename}.csv")
    if path.exists():
        with path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            print(f"✓ {filename}.csv: {len(rows)} sentences")
    else:
        print(f"✗ {filename}.csv NOT FOUND")
