#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import sys
import uuid
from datetime import datetime, timezone
from getpass import getpass
from pathlib import Path

# Allow importing from src/ when script is run from repo root.
sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from isdr_api.database import SessionLocal
from isdr_api.db_models_extended import User, Wallet


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def upsert_admin(email: str, full_name: str, password: str | None, user_id: str | None) -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        now = datetime.now(timezone.utc)

        if user is None:
            if password is None:
                raise ValueError("Password is required when creating a new admin user")

            user = User(
                id=user_id or str(uuid.uuid4()),
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                auth_provider="local",
                is_verified=True,
                onboarding_completed=True,
                role="admin",
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.flush()
            action = "created"
        else:
            user.full_name = full_name or user.full_name
            user.role = "admin"
            user.is_verified = True
            user.updated_at = now
            if password:
                user.password_hash = hash_password(password)
            action = "updated"

        wallet = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        if wallet is None:
            wallet = Wallet(
                id=str(uuid.uuid4()),
                user_id=user.id,
                balance=0.0,
                currency="USD",
                last_updated=now,
                created_at=now,
            )
            db.add(wallet)

        db.commit()
        return f"Admin {action}: id={user.id} email={user.email}"
    finally:
        db.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or promote an admin user for ISDR."
    )
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument(
        "--full-name",
        required=False,
        default="ISDR Admin",
        help="Admin full name",
    )
    parser.add_argument(
        "--password",
        required=False,
        default=None,
        help="Admin password (omit to be prompted; optional when promoting existing user)",
    )
    parser.add_argument(
        "--user-id",
        required=False,
        default=None,
        help="Optional user ID to use when creating a new admin",
    )
    parser.add_argument(
        "--prompt-password",
        action="store_true",
        help="Prompt securely for password",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    password = args.password
    if args.prompt_password and not password:
        first = getpass("Admin password: ")
        second = getpass("Confirm password: ")
        if first != second:
            print("Error: password confirmation does not match", file=sys.stderr)
            return 1
        password = first

    try:
        result = upsert_admin(
            email=args.email.strip().lower(),
            full_name=args.full_name.strip(),
            password=password,
            user_id=args.user_id,
        )
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
