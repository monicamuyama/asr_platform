from __future__ import annotations

import hashlib
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from isdr_api.database import Base, get_db
from isdr_api.db_models_extended import (
    ConsentDocument,
    Country,
    DatasetEntry,
    DatasetSpeakerId,
    Language,
    Recording,
    SpeechCondition,
    TranscriptionTask,
    TranscriptionValidation,
    TranslationTask,
    User,
    UserLanguagePreference,
)
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
TEST_PASSWORD = "testpass123"


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def _seed_reference_data() -> tuple[str, str, str, str]:
    db = TestingSessionLocal()
    try:
        country = Country(country_name="Uganda", iso_code="UG", region="Africa")
        language = Language(language_name="Luganda", iso_code="LG", country=country, is_low_resource=True)
        speech_condition = SpeechCondition(
            condition_name="stutter",
            description="Speech with repetitions, prolongations, or blocks.",
            research_notes="Test seed",
        )
        privacy = ConsentDocument(
            title="Privacy Policy",
            document_type="privacy_policy",
            version="v1",
            document_url="/privacy",
            is_active=True,
        )
        research = ConsentDocument(
            title="Research Consent",
            document_type="research_consent",
            version="v1",
            document_url="/research",
            is_active=True,
        )
        db.add_all([country, language, speech_condition, privacy, research])
        db.commit()
        db.refresh(country)
        db.refresh(language)
        db.refresh(speech_condition)
        db.refresh(privacy)
        db.refresh(research)
        return language.id, speech_condition.id, privacy.id, research.id
    finally:
        db.close()


def _create_user_with_preferences(user_id: str, language_id: str, *, can_record: bool, can_transcribe: bool, can_validate: bool, role: str = "contributor") -> None:
    db = TestingSessionLocal()
    try:
        language = db.query(Language).filter(Language.id == language_id).first()
        if language is None:
            raise RuntimeError("Language must exist before creating users")

        user = User(
            id=user_id,
            full_name=f"{user_id} Tester",
            email=f"{user_id}@example.com",
            password_hash=hashlib.sha256(TEST_PASSWORD.encode()).hexdigest(),
            auth_provider="local",
            is_verified=True,
            role=role,
            onboarding_completed=True,
        )
        db.add(user)
        db.flush()
        db.add(
            UserLanguagePreference(
                user_id=user_id,
                language_id=language_id,
                is_primary_language=True,
                can_record=can_record,
                can_transcribe=can_transcribe,
                can_validate=can_validate,
                proficiency_level="native",
            )
        )
        next_sequence = db.query(DatasetSpeakerId).count() + 1
        db.add(
            DatasetSpeakerId(
                user_id=user_id,
                speaker_code=f"UG-{language.iso_code}-{str(next_sequence).zfill(6)}",
                country_code="UG",
                language_code=language.iso_code,
                sequence_number=next_sequence,
            )
        )
        db.commit()
    finally:
        db.close()


def _auth_headers(user_email: str, password: str = TEST_PASSWORD) -> dict[str, str]:
    signin_response = client.post(
        "/auth/signin",
        json={"email": user_email, "password": password},
    )
    assert signin_response.status_code == 200
    token = signin_response.json()["token"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_signup_creates_user_and_speaker_id():
    language_id, speech_condition_id, privacy_id, research_id = _seed_reference_data()

    response = client.post(
        "/auth/signup",
        json={
            "full_name": "Monica",
            "email": "monica@example.com",
            "phone_number": "+256700000001",
            "password": "strongpassword",
            "consents": [
                {"document_id": privacy_id, "agreed": True},
                {"document_id": research_id, "agreed": True},
            ],
            "country": "Uganda",
            "primary_language": "Luganda",
            "preferred_contribution_type": "recording",
            "has_speech_impairment": False,
            "impairment_type": None,
            "bio": "Test contributor",
            "age_range": "25_34",
            "gender": "female",
            "country_id": None,
            "region_id": None,
            "district": None,
            "native_language_id": language_id,
            "education_level": "university",
            "speech_conditions": [{"condition_id": speech_condition_id, "severity_level": "mild", "is_willing_to_contribute_for_research": True, "notes": ""}],
            "language_preferences": [
                {
                    "language_id": language_id,
                    "dialect_id": None,
                    "is_primary_language": True,
                    "can_record": True,
                    "can_transcribe": True,
                    "can_validate": True,
                    "proficiency_level": "native",
                }
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "monica@example.com"
    assert data["speaker_id"]["speaker_code"].startswith("UG-LG-")


def test_recording_to_dataset_pipeline():
    language_id, _, _, _ = _seed_reference_data()
    _create_user_with_preferences("recorder", language_id, can_record=True, can_transcribe=True, can_validate=True)
    _create_user_with_preferences("transcriber", language_id, can_record=True, can_transcribe=True, can_validate=True)
    _create_user_with_preferences("validator1", language_id, can_record=True, can_transcribe=False, can_validate=True)
    _create_user_with_preferences("validator2", language_id, can_record=True, can_transcribe=False, can_validate=True)
    _create_user_with_preferences("expert01", language_id, can_record=True, can_transcribe=False, can_validate=False, role="expert")

    recording_resp = client.post(
        "/transcription/recordings",
        json={
            "user_id": "recorder",
            "language_id": language_id,
            "dialect_id": None,
            "sentence_id": None,
            "audio_url": "https://example.com/audio.wav",
            "duration_seconds": 3.5,
            "audio_quality_score": 0.92,
            "speaker_type": "normal",
            "recording_device": "mobile",
            "noise_level": "quiet",
        },
        headers=_auth_headers("recorder@example.com"),
    )
    assert recording_resp.status_code == 200
    recording_id = recording_resp.json()["id"]

    task_resp = client.post(
        "/transcription/tasks",
        json={
            "recording_id": recording_id,
            "transcriber_id": "transcriber",
            "transcribed_text": "Hello world",
            "confidence_score": 0.95,
        },
        headers=_auth_headers("transcriber@example.com"),
    )
    assert task_resp.status_code == 200
    task_id = task_resp.json()["id"]

    for validator_id, rating in (("validator1", 5), ("validator2", 4)):
        validation_resp = client.post(
            f"/transcription/tasks/{task_id}/validations",
            json={
                "transcription_id": task_id,
                "validator_id": validator_id,
                "rating": rating,
                "is_correct": True,
                "suggested_correction": None,
                "comments": "Looks good",
                "deep_cultural_meaning": None,
            },
            headers=_auth_headers(f"{validator_id}@example.com"),
        )
        assert validation_resp.status_code == 200

    client.post(
        f"/transcription/tasks/{task_id}/translations",
        json={
            "transcription_id": task_id,
            "translator_id": "transcriber",
            "target_language_code": "ENG",
            "translated_text": "Hello world",
        },
        headers=_auth_headers("transcriber@example.com"),
    )

    graduate_resp = client.post(
        f"/transcription/tasks/{task_id}/graduate",
        json={
            "expert_id": "expert01",
            "is_approved": True,
            "corrected_text": "Hello world",
            "quality_tier": "High",
            "condition_annotation": None,
            "notes": "Clear recording",
            "add_to_dictionary": True,
            "dictionary_word": "hello",
            "phoneme_representation": "həˈloʊ",
        },
        headers=_auth_headers("expert01@example.com"),
    )
    assert graduate_resp.status_code == 200
    payload = graduate_resp.json()
    assert payload["review"]["is_approved"] is True
    assert payload["dataset_entry"]["final_transcription"] == "Hello world"
    assert payload["dictionary_entry"]["word"] == "hello"

    db = TestingSessionLocal()
    try:
        recording = db.query(Recording).filter(Recording.id == recording_id).first()
        assert recording is not None
        assert recording.status == "graduated"
        assert db.query(DatasetEntry).count() == 1
        assert db.query(TranscriptionTask).count() == 1
        assert db.query(TranscriptionValidation).count() == 2
        assert db.query(TranslationTask).count() == 1
    finally:
        db.close()


def test_recording_requires_record_permission():
    language_id, _, _, _ = _seed_reference_data()
    _create_user_with_preferences("listener", language_id, can_record=False, can_transcribe=False, can_validate=False)

    response = client.post(
        "/transcription/recordings",
        json={
            "user_id": "listener",
            "language_id": language_id,
            "audio_url": "https://example.com/audio.wav",
            "duration_seconds": 2.0,
        },
        headers=_auth_headers("listener@example.com"),
    )
    assert response.status_code == 403


def test_transcription_write_requires_authentication():
    language_id, _, _, _ = _seed_reference_data()
    _create_user_with_preferences("recorder", language_id, can_record=True, can_transcribe=False, can_validate=False)

    response = client.post(
        "/transcription/recordings",
        json={
            "user_id": "recorder",
            "language_id": language_id,
            "audio_url": "https://example.com/audio.wav",
            "duration_seconds": 2.0,
        },
    )
    assert response.status_code == 401
