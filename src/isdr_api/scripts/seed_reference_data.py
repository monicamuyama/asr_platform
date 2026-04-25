from __future__ import annotations

from isdr_api.bootstrap_data import seed_reference_data
from isdr_api.database import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        seed_reference_data(db)
    finally:
        db.close()
    print("Reference data seeded successfully")


if __name__ == "__main__":
    main()
