from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from isdr_api.database import Base, get_db
from isdr_api.db_models import Base as LegacyBase
from isdr_api.db_models_extended import Language, User, UserLanguagePreference
from isdr_api.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=test_engine)
    LegacyBase.metadata.create_all(bind=test_engine)
    yield
    LegacyBase.metadata.drop_all(bind=test_engine)
    Base.metadata.drop_all(bind=test_engine)


# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_governance_active_returns_defaults():
    response = client.get("/governance/active")
    assert response.status_code == 200
    data = response.json()
    assert data["quorum_q"] == 5
    assert data["theta_reject"] == 2.5
    assert data["theta_accept"] == 3.5


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def test_register_user_and_list_users():
    response = client.post(
        "/users/register",
        json={
            "handle": "monica_voice",
            "display_name": "Monica",
            "preferred_language": "lg",
        },
    )
    assert response.status_code == 200
    user = response.json()
    assert user["handle"] == "monica_voice"

    list_response = client.get("/users")
    assert list_response.status_code == 200
    users = list_response.json()
    assert len(users) == 1
    assert users[0]["handle"] == "monica_voice"


def test_register_duplicate_handle_blocked():
    payload = {
        "handle": "repeat_handle",
        "display_name": "Person One",
        "preferred_language": "en",
    }
    first = client.post("/users/register", json=payload)
    assert first.status_code == 200

    second = client.post("/users/register", json=payload)
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"]


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------

_SUB_PAYLOAD = {
    "contributor_id": "c1",
    "language_code": "lg",
    "mode": "prompted",
    "speaker_profile": "healthy",
    "consent_version": "v1.0",
}


def _create_submission(overrides: dict | None = None) -> dict:
    payload = {**_SUB_PAYLOAD, **(overrides or {})}
    response = client.post("/submissions", json=payload)
    assert response.status_code == 200
    return response.json()


def _seed_transcription_user(
    user_id: str,
    *,
    role: str = "contributor",
    can_transcribe: bool = False,
    can_validate: bool = False,
    language_iso: str = "LG",
) -> None:
    db = TestingSessionLocal()
    try:
        language = db.query(Language).filter(Language.iso_code == language_iso).first()
        if language is None:
            language = Language(language_name=language_iso, iso_code=language_iso, is_low_resource=True)
            db.add(language)
            db.flush()

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            user = User(
                id=user_id,
                full_name=f"{user_id} Tester",
                email=f"{user_id}@example.com",
                role=role,
                auth_provider="local",
                is_verified=True,
                onboarding_completed=True,
            )
            db.add(user)
            db.flush()
        else:
            user.role = role

        preference = (
            db.query(UserLanguagePreference)
            .filter(
                UserLanguagePreference.user_id == user_id,
                UserLanguagePreference.language_id == language.id,
            )
            .first()
        )
        if preference is None:
            preference = UserLanguagePreference(
                user_id=user_id,
                language_id=language.id,
                is_primary_language=True,
                can_record=True,
                can_transcribe=can_transcribe,
                can_validate=can_validate,
                proficiency_level="native",
            )
            db.add(preference)
        else:
            preference.can_transcribe = can_transcribe
            preference.can_validate = can_validate

        db.commit()
    finally:
        db.close()


def test_create_submission_defaults_to_pending_community():
    data = _create_submission()
    assert data["status"] == "PENDING_COMMUNITY"
    assert data["aggregate_score"] is None


def test_get_submission_by_id():
    sub = _create_submission()
    response = client.get(f"/submissions/{sub['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == sub["id"]


def test_get_submission_404():
    response = client.get("/submissions/nonexistent")
    assert response.status_code == 404


def test_list_submissions():
    _create_submission()
    _create_submission({"contributor_id": "c2"})
    response = client.get("/submissions")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_create_read_out_submission_with_prompt_fields():
    response = client.post(
        "/submissions",
        json={
            "contributor_id": "c_read",
            "language_code": "en",
            "mode": "read_out",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "target_word": "banana",
            "read_prompt": "Please read this word clearly: banana",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "read_out"
    assert data["target_word"] == "banana"
    assert data["read_prompt"] is not None


def test_spontaneous_image_submission_requires_image_fields():
    response = client.post(
        "/submissions",
        json={
            "contributor_id": "c_sp",
            "language_code": "en",
            "mode": "spontaneous_image",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
        },
    )
    assert response.status_code == 422


def test_audio_submission_enters_transcription_queue():
    _seed_transcription_user("c_audio", can_transcribe=True, can_validate=True)

    response = client.post(
        "/submissions",
        json={
            "contributor_id": "c_audio",
            "language_code": "lg",
            "mode": "recording",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "target_word": "The river bends but does not break",
            "audio_url": "data:audio/webm;base64,AAAA",
            "category": "proverb",
        },
    )
    assert response.status_code == 200

    queue_response = client.get("/transcription/queue")
    assert queue_response.status_code == 200
    queue = queue_response.json()
    assert len(queue) == 1
    assert queue[0]["audio_url"] == "data:audio/webm;base64,AAAA"


def test_transcription_validation_and_graduation_flow():
    _seed_transcription_user("c_transcribe", can_transcribe=True, can_validate=True)
    _seed_transcription_user("transcriber_01", can_transcribe=True, can_validate=False)
    _seed_transcription_user("validator_01", can_transcribe=False, can_validate=True)
    _seed_transcription_user("expert_01", role="expert", can_transcribe=False, can_validate=True)

    submission = client.post(
        "/submissions",
        json={
            "contributor_id": "c_transcribe",
            "language_code": "lg",
            "mode": "recording",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "target_word": "Wisdom is found in many hearts",
            "audio_url": "data:audio/webm;base64,BBBB",
            "category": "proverb",
        },
    ).json()

    queue_item = client.get("/transcription/queue").json()[0]
    task_response = client.post(
        "/transcription/tasks",
        json={
            "recording_id": queue_item["recording_id"],
            "transcriber_id": "transcriber_01",
            "transcribed_text": "Wisdom is found in many hearts",
            "confidence_score": 0.96,
        },
    )
    assert task_response.status_code == 200
    task_id = task_response.json()["id"]

    validation_response = client.post(
        f"/transcription/tasks/{task_id}/validations",
        json={
            "transcription_id": task_id,
            "validator_id": "validator_01",
            "rating": 5,
            "is_correct": True,
            "deep_cultural_meaning": "The proverb emphasizes collective wisdom.",
        },
    )
    assert validation_response.status_code == 200

    translation_response = client.post(
        f"/transcription/tasks/{task_id}/translations",
        json={
            "transcription_id": task_id,
            "translator_id": "transcriber_01",
            "target_language_code": "ENG",
            "translated_text": "Wisdom is found in many hearts",
        },
    )
    assert translation_response.status_code == 200

    graduate_response = client.post(
        f"/transcription/tasks/{task_id}/graduate",
        json={"expert_id": "expert_01"},
    )
    assert graduate_response.status_code == 200
    assert graduate_response.json()["sentence_text"] == "Wisdom is found in many hearts"

    prompt_bank = client.get("/transcription/prompt-bank")
    assert prompt_bank.status_code == 200
    assert any(item["sentence_text"] == "Wisdom is found in many hearts" for item in prompt_bank.json())


def test_transcription_graduation_requires_expert_role():
    _seed_transcription_user("c_role", can_transcribe=True, can_validate=True)
    _seed_transcription_user("transcriber_role", can_transcribe=True, can_validate=False)
    _seed_transcription_user("validator_role", can_transcribe=False, can_validate=True)
    _seed_transcription_user("not_expert", role="contributor", can_transcribe=True, can_validate=True)

    client.post(
        "/submissions",
        json={
            "contributor_id": "c_role",
            "language_code": "lg",
            "mode": "recording",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "target_word": "The drumbeat carries memory",
            "audio_url": "data:audio/webm;base64,CCCC",
            "category": "proverb",
        },
    )

    queue_item = client.get("/transcription/queue").json()[0]
    task_id = client.post(
        "/transcription/tasks",
        json={
            "recording_id": queue_item["recording_id"],
            "transcriber_id": "transcriber_role",
            "transcribed_text": "The drumbeat carries memory",
            "confidence_score": 0.9,
        },
    ).json()["id"]

    client.post(
        f"/transcription/tasks/{task_id}/validations",
        json={
            "transcription_id": task_id,
            "validator_id": "validator_role",
            "rating": 5,
            "is_correct": True,
        },
    )

    client.post(
        f"/transcription/tasks/{task_id}/translations",
        json={
            "transcription_id": task_id,
            "translator_id": "transcriber_role",
            "target_language_code": "ENG",
            "translated_text": "The drumbeat carries memory",
        },
    )

    forbidden = client.post(
        f"/transcription/tasks/{task_id}/graduate",
        json={"expert_id": "not_expert"},
    )
    assert forbidden.status_code == 403


def test_admin_can_update_user_role():
    _seed_transcription_user("admin_01", role="admin", can_transcribe=True, can_validate=True)
    _seed_transcription_user("user_01", role="contributor", can_transcribe=False, can_validate=False)

    response = client.patch(
        "/auth/admin/users/user_01/role",
        json={"admin_user_id": "admin_01", "role": "expert"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "expert"


def test_non_admin_cannot_update_user_role():
    _seed_transcription_user("not_admin", role="contributor", can_transcribe=True, can_validate=True)
    _seed_transcription_user("target_user", role="contributor", can_transcribe=False, can_validate=False)

    response = client.patch(
        "/auth/admin/users/target_user/role",
        json={"admin_user_id": "not_admin", "role": "expert"},
    )
    assert response.status_code == 403


def test_admin_can_assign_language_capabilities():
    _seed_transcription_user("admin_lang", role="admin", can_transcribe=True, can_validate=True)
    _seed_transcription_user("user_lang", role="contributor", can_transcribe=False, can_validate=False)

    db = TestingSessionLocal()
    try:
        language = db.query(Language).filter(Language.iso_code == "LG").first()
        assert language is not None
        language_id = language.id
    finally:
        db.close()

    response = client.patch(
        "/auth/admin/users/user_lang/language-preferences",
        json={
            "admin_user_id": "admin_lang",
            "language_id": language_id,
            "can_record": True,
            "can_transcribe": True,
            "can_validate": True,
            "is_primary_language": True,
            "proficiency_level": "fluent",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["can_transcribe"] is True
    assert payload["can_validate"] is True
    assert payload["proficiency_level"] == "fluent"


# ---------------------------------------------------------------------------
# Community validation
# ---------------------------------------------------------------------------


def test_community_queue_shows_pending():
    _create_submission()
    response = client.get("/community/queue")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["ratings_count"] == 0


def test_self_rating_blocked():
    sub = _create_submission()
    response = client.post(
        "/community/ratings",
        json={
            "submission_id": sub["id"],
            "rater_id": "c1",
            "intelligibility": 5,
            "recording_quality": 5,
            "elicitation_compliance": 5,
        },
    )
    assert response.status_code == 400
    assert "own submission" in response.json()["detail"]


def test_duplicate_rating_blocked():
    sub = _create_submission()
    rating = {
        "submission_id": sub["id"],
        "rater_id": "v1",
        "intelligibility": 4,
        "recording_quality": 4,
        "elicitation_compliance": 4,
    }
    client.post("/community/ratings", json=rating)
    response = client.post("/community/ratings", json=rating)
    assert response.status_code == 400
    assert "already rated" in response.json()["detail"]


def _rate_n(sub_id: str, score: int, count: int) -> dict:
    for i in range(count):
        resp = client.post(
            "/community/ratings",
            json={
                "submission_id": sub_id,
                "rater_id": f"v{i + 1}",
                "intelligibility": score,
                "recording_quality": score,
                "elicitation_compliance": score,
            },
        )
        assert resp.status_code == 200
    return client.get(f"/submissions/{sub_id}").json()


def test_routes_to_expert_with_high_scores():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=4, count=5)
    assert updated["status"] == "PENDING_EXPERT"
    assert updated["aggregate_score"] is not None


def test_rejected_with_low_scores():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=2, count=5)
    assert updated["status"] == "REJECTED_COMMUNITY"


def test_pending_before_quorum():
    sub = _create_submission()
    updated = _rate_n(sub["id"], score=5, count=3)
    assert updated["status"] == "PENDING_COMMUNITY"


# ---------------------------------------------------------------------------
# Expert validation
# ---------------------------------------------------------------------------


def _advance_to_expert() -> str:
    sub = _create_submission()
    _rate_n(sub["id"], score=4, count=5)
    return sub["id"]


def test_expert_queue_shows_pending_expert():
    sub_id = _advance_to_expert()
    response = client.get("/expert/queue")
    assert response.status_code == 200
    items = response.json()
    assert any(item["id"] == sub_id for item in items)


def test_expert_accepts_submission():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": "High",
            "condition_annotation": None,
            "notes": "Clean recording",
        },
    )
    assert response.status_code == 200
    assert response.json()["decision"] == "accepted"
    updated = client.get(f"/submissions/{sub_id}").json()
    assert updated["status"] == "ACCEPTED"


def test_expert_rejects_submission():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "rejected",
            "quality_tier": None,
            "condition_annotation": "poor articulation",
            "notes": "Does not meet standard",
        },
    )
    assert response.status_code == 200
    updated = client.get(f"/submissions/{sub_id}").json()
    assert updated["status"] == "REJECTED_EXPERT"


def test_expert_review_on_non_pending_expert_blocked():
    sub = _create_submission()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub["id"],
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": "Standard",
        },
    )
    assert response.status_code == 400


def test_accept_without_quality_tier_blocked():
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": None,
        },
    )
    assert response.status_code == 400
    assert "quality_tier" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Tipping
# ---------------------------------------------------------------------------


def _advance_to_accepted() -> str:
    sub_id = _advance_to_expert()
    response = client.post(
        "/expert/reviews",
        json={
            "submission_id": sub_id,
            "expert_id": "expert_01",
            "decision": "accepted",
            "quality_tier": "Standard",
        },
    )
    assert response.status_code == 200
    return sub_id


def test_tip_accepted_submission():
    sub_id = _advance_to_accepted()
    response = client.post(
        "/tips",
        json={
            "submission_id": sub_id,
            "tipper_id": "listener_01",
            "amount": 4.5,
            "rating": 5,
            "currency": "USD",
            "message": "Great contribution",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["submission_id"] == sub_id
    assert data["contributor_id"] == "c1"
    assert data["amount"] == 4.5
    assert data["rating"] == 5


def test_tip_non_accepted_submission_blocked():
    sub = _create_submission()
    response = client.post(
        "/tips",
        json={
            "submission_id": sub["id"],
            "tipper_id": "listener_01",
            "amount": 2.0,
            "rating": 4,
            "currency": "USD",
        },
    )
    assert response.status_code == 400
    assert "only allowed" in response.json()["detail"]


def test_self_tip_blocked():
    sub_id = _advance_to_accepted()
    response = client.post(
        "/tips",
        json={
            "submission_id": sub_id,
            "tipper_id": "c1",
            "amount": 1.0,
            "rating": 5,
            "currency": "USD",
        },
    )
    assert response.status_code == 400
    assert "cannot tip their own" in response.json()["detail"]


def test_contributor_tip_summary():
    sub_id = _advance_to_accepted()
    client.post(
        "/tips",
        json={
            "submission_id": sub_id,
            "tipper_id": "listener_01",
            "amount": 3.0,
            "rating": 4,
            "currency": "USD",
        },
    )
    client.post(
        "/tips",
        json={
            "submission_id": sub_id,
            "tipper_id": "listener_02",
            "amount": 2.5,
            "rating": 5,
            "currency": "USD",
        },
    )
    response = client.get("/tips/contributors/c1")
    assert response.status_code == 200
    summary = response.json()
    assert summary["contributor_id"] == "c1"
    assert summary["total_tips"] == 2
    assert summary["total_amount"] == 5.5
    assert summary["average_rating"] == 4.5
