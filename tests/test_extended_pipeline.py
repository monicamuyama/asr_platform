from __future__ import annotations

import hashlib
import tempfile
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from isdr_api.database import Base, get_db
from isdr_api.db_models import Submission, ContributorTranslation, Base as LegacyBase
from isdr_api.db_models_extended import (
    ConsentDocument,
    Country,
    DatasetEntry,
    DatasetSpeakerId,
    Language,
    Recording,
    SourceTranslationTask,
    SpeechCondition,
    TranscriptionTask,
    TranscriptionValidation,
    TranslationTask,
    User,
    UserLanguagePreference,
)
from isdr_api.main import app
from isdr_api.source_ingestion import import_source_corpora

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
    # Drop all tables first to ensure clean state
    LegacyBase.metadata.drop_all(bind=test_engine)
    Base.metadata.drop_all(bind=test_engine)
  
    # Create all tables fresh
    LegacyBase.metadata.create_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    
    # Clean up after test
    LegacyBase.metadata.drop_all(bind=test_engine)
    Base.metadata.drop_all(bind=test_engine)


def _seed_reference_data() -> tuple[str, str, str, str]:
    db = TestingSessionLocal()
    try:
        country = Country(country_name="Uganda", iso_code="UG", region="Africa")
        language = Language(language_name="Luganda", iso_code="LG", country=country, is_low_resource=True)
        english = Language(language_name="English", iso_code="ENG", country=country, is_low_resource=False)
        acholi = Language(language_name="Acholi", iso_code="ACH", country=country, is_low_resource=True)
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
        db.add_all([country, language, english, acholi, speech_condition, privacy, research])
        db.commit()
        db.refresh(country)
        db.refresh(language)
        db.refresh(english)
        db.refresh(acholi)
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


def test_source_ingestion_bootstraps_multilingual_translation_tasks():
    language_id, _, _, _ = _seed_reference_data()
    _create_user_with_preferences("translator_lg", language_id, can_record=False, can_transcribe=True, can_validate=False)
    _create_user_with_preferences("expert02", language_id, can_record=False, can_transcribe=False, can_validate=False, role="expert")

    db = TestingSessionLocal()
    with tempfile.TemporaryDirectory() as temp_dir:
        tsv_path = Path(temp_dir) / "English-Luganda.tsv"
        csv_path = Path(temp_dir) / "Luganda Monolingual Corpus.csv"

        tsv_path.write_text("Hello\tOli otya\n", encoding="utf-8")
        csv_path.write_text("Tukusanyukidde\n", encoding="utf-8")

        stats = import_source_corpora(
            db=db,
            english_luganda_tsv=tsv_path,
            luganda_monolingual_csv=csv_path,
            dry_run=False,
        )

    assert stats.english_sentences_created == 1
    assert stats.source_pairs_created == 1
    assert stats.source_translation_tasks_created == 2

    luganda = db.query(Language).filter(Language.iso_code == "LG").first()
    assert luganda is not None
    source_tasks = db.query(SourceTranslationTask).all()
    assert len(source_tasks) == 2

    queue_response = client.get(
        f"/transcription/source-translation-queue?target_language_id={luganda.id}&status=prefilled"
    )
    assert queue_response.status_code == 200
    queue_items = queue_response.json()
    assert len(queue_items) == 1
    task_id = queue_items[0]["id"]
    assert queue_items[0]["machine_prefill_text"] == "Oli otya"

    submit_response = client.post(
        f"/transcription/source-translations/{task_id}/submit",
        json={
            "translator_id": "translator_lg",
            "translated_text": "Oli otya?",
        },
        headers=_auth_headers("translator_lg@example.com"),
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["status"] == "submitted"

    review_response = client.post(
        f"/transcription/source-translations/{task_id}/review",
        json={
            "reviewer_id": "expert02",
            "approved": True,
            "reviewed_text": "Oli otya?",
            "notes": "Approved for prompt bank",
        },
        headers=_auth_headers("expert02@example.com"),
    )
    assert review_response.status_code == 200
    assert review_response.json()["status"] == "approved"

    db.close()


# ============================================================================
# CONTRIBUTOR SUBMISSION WITH TRANSCRIPTION & TRANSLATION WORKFLOW
# ============================================================================


def test_contributor_submission_with_transcription_and_translation():
    """Test complete contributor submission flow with transcription and translation."""
    db = TestingSessionLocal()

    # Create submission with recording, transcription, and translation
    submission_response = client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_01",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,AAAA",
            "contributor_transcription": "Omutima gwa mutwe",
            "translations": [
                {
                    "source_language_code": "lg",
                    "target_language_code": "eng",
                    "source_text": "Omutima gwa mutwe",
                    "translated_text": "The heart beats in the head",
                }
            ],
        },
    )
    assert submission_response.status_code == 200
    submission = submission_response.json()
    assert submission["status"] == "PENDING_COMMUNITY"
    assert submission["contributor_transcription"] == "Omutima gwa mutwe"
    submission_id = submission["id"]

    # Verify submission was created with transcription
    db_submission = db.query(Submission).filter(Submission.id == submission_id).first()
    assert db_submission is not None
    assert db_submission.contributor_transcription == "Omutima gwa mutwe"

    db.close()


def test_contributor_submission_requires_recording():
    """Test that submission requires audio_url."""
    response = client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_02",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "contributor_transcription": "Some text",
        },
    )
    assert response.status_code == 400
    assert "audio_url" in response.json()["detail"]


def test_contributor_submission_requires_transcription_or_translation():
    """Test that submission requires transcription or translation."""
    response = client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_03",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,AAAA",
        },
    )
    assert response.status_code == 400
    assert "Transcription or at least one translation is required" in response.json()["detail"]


def test_add_translation_to_submission_after_creation():
    """Test adding translation to submission after initial creation."""
    db = TestingSessionLocal()

    # Create initial submission with just transcription
    submission_response = client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_04",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,AAAA",
            "contributor_transcription": "Kabaka akabala",
        },
    )
    assert submission_response.status_code == 200
    submission_id = submission_response.json()["id"]

    # Add translation after creation
    translation_response = client.post(
        f"/submissions/{submission_id}/translations",
        json={
            "source_language_code": "lg",
            "target_language_code": "eng",
            "source_text": "Kabaka akabala",
            "translated_text": "The king breaks",
        },
    )
    assert translation_response.status_code == 200
    translation = translation_response.json()
    assert translation["status"] == "submitted"
    assert translation["source_text"] == "Kabaka akabala"
    assert translation["translated_text"] == "The king breaks"

    # Verify translation was created in database
    db_translation = db.query(ContributorTranslation).filter(
        ContributorTranslation.submission_id == submission_id
    ).first()
    assert db_translation is not None
    assert db_translation.translator_id == "contributor_04"

    db.close()


def test_list_submission_translations():
    """Test retrieving all translations for a submission."""
    # Create submission with translations
    submission_response = client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_05",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,AAAA",
            "contributor_transcription": "Abalala bakola",
            "translations": [
                {
                    "source_language_code": "lg",
                    "target_language_code": "eng",
                    "source_text": "Abalala bakola",
                    "translated_text": "Fools work",
                }
            ],
        },
    )
    submission_id = submission_response.json()["id"]

    # Add another translation
    client.post(
        f"/submissions/{submission_id}/translations",
        json={
            "source_language_code": "lg",
            "target_language_code": "swa",
            "source_text": "Abalala bakola",
            "translated_text": "Wazimu wanafanya kazi",
        },
    )

    # List all translations
    list_response = client.get(f"/submissions/{submission_id}/translations")
    assert list_response.status_code == 200
    translations = list_response.json()
    assert len(translations) == 2
    targets = {t["target_language_code"] for t in translations}
    assert targets == {"ENG", "SWA"}


def test_list_submissions_by_contributor():
    """Test filtering submissions by contributor."""
    # Create submissions for different contributors
    client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_a",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,AAAA",
            "contributor_transcription": "Text A",
        },
    )

    client.post(
        "/submissions",
        json={
            "contributor_id": "contributor_b",
            "language_code": "lg",
            "native_language_code": "lg",
            "target_language_code": "lg",
            "mode": "recording",
            "category": "proverb",
            "speaker_profile": "healthy",
            "consent_version": "v1.0",
            "audio_url": "data:audio/webm;base64,BBBB",
            "contributor_transcription": "Text B",
        },
    )

    # List submissions for contributor_a
    response = client.get("/submissions?contributor_id=contributor_a")
    assert response.status_code == 200
    submissions = response.json()
    assert len(submissions) == 1
    assert submissions[0]["contributor_id"] == "contributor_a"
