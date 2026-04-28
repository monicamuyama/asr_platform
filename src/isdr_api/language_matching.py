from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from isdr_api.db_models_extended import Language, UserLanguagePreference

PRIMARY_LANGUAGE_REWARD = 10.0
SECONDARY_LANGUAGE_REWARD = 8.0


def normalize_language_code(language_code: str) -> str:
    return language_code.strip().lower()


def get_language_by_code(db: Session, language_code: str) -> Language | None:
    return (
        db.query(Language)
        .filter(func.lower(Language.iso_code) == normalize_language_code(language_code))
        .first()
    )


def get_user_language_preference(
    db: Session,
    user_id: str,
    language_id: str,
) -> UserLanguagePreference | None:
    return (
        db.query(UserLanguagePreference)
        .filter(
            UserLanguagePreference.user_id == user_id,
            UserLanguagePreference.language_id == language_id,
        )
        .first()
    )


def require_declared_language_preference(
    db: Session,
    user_id: str,
    language_code: str,
) -> tuple[Language, UserLanguagePreference]:
    language = get_language_by_code(db, language_code)
    if language is None:
        raise HTTPException(
            status_code=403,
            detail="Contributor has not declared this language in their profile",
        )

    preference = get_user_language_preference(db, user_id, language.id)
    if preference is None:
        raise HTTPException(
            status_code=403,
            detail="Contributor has not declared this language in their profile",
        )

    return language, preference


def require_language_capability(
    db: Session,
    user_id: str,
    language_id: str,
    capability: str,
) -> UserLanguagePreference:
    preference = get_user_language_preference(db, user_id, language_id)
    if preference is None:
        raise HTTPException(status_code=403, detail="No language preference configured for this task")

    if capability == "transcribe" and not preference.can_transcribe:
        raise HTTPException(status_code=403, detail="User is not permitted to transcribe this language")
    if capability == "validate" and not preference.can_validate:
        raise HTTPException(status_code=403, detail="User is not permitted to peer review this language")
    if capability == "record" and not preference.can_record:
        raise HTTPException(status_code=403, detail="User is not permitted to record this language")

    return preference


def require_recording_capability(
    db: Session,
    user_id: str,
    language_id: str,
) -> UserLanguagePreference:
    return require_language_capability(db, user_id, language_id, "record")


def recording_reward_for_preference(preference: UserLanguagePreference) -> float:
    return PRIMARY_LANGUAGE_REWARD if preference.is_primary_language else SECONDARY_LANGUAGE_REWARD


def list_language_matched_validator_ids(
    db: Session,
    language_id: str,
) -> list[str]:
    rows = (
        db.query(UserLanguagePreference.user_id)
        .filter(
            UserLanguagePreference.language_id == language_id,
            UserLanguagePreference.can_validate.is_(True),
        )
        .order_by(
            UserLanguagePreference.is_primary_language.desc(),
            case(
                (UserLanguagePreference.proficiency_level == "native", 4),
                (UserLanguagePreference.proficiency_level == "fluent", 3),
                (UserLanguagePreference.proficiency_level == "intermediate", 2),
                (UserLanguagePreference.proficiency_level == "beginner", 1),
                else_=0,
            ).desc(),
            UserLanguagePreference.created_at.asc(),
        )
        .distinct()
        .all()
    )
    return [user_id for (user_id,) in rows]