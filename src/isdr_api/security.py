from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models_extended import User

TOKEN_TTL_HOURS = int(os.getenv("ACCESS_TOKEN_TTL_HOURS", "8"))
JWT_SECRET = os.getenv("JWT_SECRET", "isdr-dev-secret-change-me")
JWT_ALG = "HS256"
APP_ENV = os.getenv("APP_ENV", "development").lower()

if APP_ENV == "production" and JWT_SECRET == "isdr-dev-secret-change-me":
    raise RuntimeError("JWT_SECRET must be set in production")

bearer_scheme = HTTPBearer(auto_error=False)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(user: User) -> dict[str, Any]:
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(hours=TOKEN_TTL_HOURS)

    header = {"alg": JWT_ALG, "typ": "JWT"}
    payload = {
        "sub": user.id,
        "role": user.role,
        "email": user.email,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    token = f"{header_segment}.{payload_segment}.{_b64url_encode(signature)}"

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_at": expires_at,
    }


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token format") from exc

    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    expected_signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        provided_signature = _b64url_decode(signature_segment)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token signature") from exc

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(status_code=401, detail="Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(payload_segment).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token payload") from exc

    exp = payload.get("exp")
    sub = payload.get("sub")
    if not isinstance(exp, int) or not sub:
        raise HTTPException(status_code=401, detail="Invalid token claims")

    if datetime.now(timezone.utc).timestamp() > exp:
        raise HTTPException(status_code=401, detail="Token has expired")

    return payload


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Token user not found")
    return user


def require_user_match_or_admin(current_user: User, target_user_id: str) -> None:
    if current_user.role == "admin":
        return
    if current_user.id != target_user_id:
        raise HTTPException(status_code=403, detail="You can only act as your own user account")
