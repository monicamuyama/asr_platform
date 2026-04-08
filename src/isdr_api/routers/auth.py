from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from isdr_api.database import get_db
from isdr_api.db_models_extended import (  # noqa: F401 - deliberate use of extended models only
    ConsentDocument,
    Country,
    DatasetSpeakerId,
    Dialect,
    Language,
    Region,
    SpeechCondition,
    User,
    UserConsent,
    UserDemographics,
    UserLanguagePreference,
    UserProfile,
    UserSpeechCondition,
    Wallet,
)
from isdr_api.schemas_extended import (
    ConsentDocumentSchema,
    CountrySchema,
    DatasetSpeakerIdSchema,
    DialectSchema,
    FullSignupRequest,
    LanguageSchema,
    RegionSchema,
    SignupResponseSchema,
    UserLoginRequest,
    SpeechConditionSchema,
    UserDemographicsSchema,
    UserLanguagePreferenceSchema,
    UserProfileSchema,
    UserSchema,
    UserSpeechConditionSchema,
    WalletSchema,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================================
# HELPERS
# ============================================================================


def hash_password(password: str) -> str:
    """Simple password hashing (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_speaker_code(country_code: str, language_code: str, sequence_number: int) -> str:
    """Generate speaker code: UG-ACH-000245."""
    return f"{country_code.upper()}-{language_code.upper()}-{str(sequence_number).zfill(6)}"


# ============================================================================
# REFERENCE DATA ENDPOINTS
# ============================================================================


@router.get("/countries", response_model=list[CountrySchema])
def list_countries(db: Session = Depends(get_db)) -> list[Country]:
    """Get list of countries."""
    return db.query(Country).all()


@router.get("/regions/{country_id}", response_model=list[RegionSchema])
def list_regions(country_id: str, db: Session = Depends(get_db)) -> list[Region]:
    """Get regions for a country."""
    return (
        db.query(Region)
        .filter(Region.country_id == country_id)
        .all()
    )


@router.get("/languages", response_model=list[LanguageSchema])
def list_languages(country_id: str | None = None, db: Session = Depends(get_db)) -> list[Language]:
    """Get languages (optionally filtered by country)."""
    query = db.query(Language)
    if country_id:
        query = query.filter(Language.country_id == country_id)
    return query.all()


@router.get("/languages/{language_id}/dialects", response_model=list[DialectSchema])
def list_dialects(language_id: str, db: Session = Depends(get_db)) -> list[Dialect]:
    """Get dialects for a language."""
    return (
        db.query(Dialect)
        .filter(Dialect.language_id == language_id)
        .all()
    )


@router.get("/speech-conditions", response_model=list[SpeechConditionSchema])
def list_speech_conditions(db: Session = Depends(get_db)) -> list[SpeechCondition]:
    """Get available speech conditions."""
    return db.query(SpeechCondition).all()


@router.get("/consent-documents", response_model=list[ConsentDocumentSchema])
def list_consent_documents(db: Session = Depends(get_db)) -> list[ConsentDocument]:
    """Get active consent documents that must be signed."""
    return (
        db.query(ConsentDocument)
        .filter(ConsentDocument.is_active)
        .all()
    )


# ============================================================================
# FULL SIGNUP ENDPOINT (Research-grade)
# ============================================================================


@router.post("/signup", response_model=SignupResponseSchema)
def signup(payload: FullSignupRequest, db: Session = Depends(get_db)) -> dict:
    """
    Complete signup flow with consent, demographics, and language preferences.

    Steps:
    1. Create user account
    2. Verify all consents are signed
    3. Create user profile
    4. Populate demographics
    5. Register speech conditions (if applicable)
    6. Generate dataset speaker ID
    7. Set language preferences
    8. Create wallet
    """

    # ========================================================================
    # Step 1: Validate constraints
    # ========================================================================

    # Check email uniqueness
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check phone uniqueness if provided
    if payload.phone_number:
        existing_phone = (
            db.query(User)
            .filter(User.phone_number == payload.phone_number)
            .first()
        )
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    # Validate at least one language preference
    if not payload.language_preferences:
        raise HTTPException(
            status_code=400, detail="Must select at least one language to contribute"
        )

    # Validate all required consents are signed
    required_consent_count = (
        db.query(ConsentDocument)
        .filter(ConsentDocument.is_active)
        .count()
    )
    if len(payload.consents) != required_consent_count:
        raise HTTPException(
            status_code=400,
            detail=f"Must accept all {required_consent_count} required consent documents",
        )

    for consent in payload.consents:
        doc = (
            db.query(ConsentDocument)
            .filter(ConsentDocument.id == consent.document_id)
            .first()
        )
        if not doc or not doc.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive consent document")
        if not consent.agreed:
            raise HTTPException(status_code=400, detail="All consents must be agreed to")

    # ========================================================================
    # Step 2: Create user
    # ========================================================================

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
        auth_provider="local",
        is_verified=False,
        role="contributor",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()

    # ========================================================================
    # Step 3: Record consents
    # ========================================================================

    for consent in payload.consents:
        user_consent = UserConsent(
            id=str(uuid.uuid4()),
            user_id=user_id,
            document_id=consent.document_id,
            agreed=True,
            agreed_at=datetime.now(timezone.utc),
            ip_address="0.0.0.0",  # Would come from request context
            user_agent="web",  # Would come from request headers
            created_at=datetime.now(timezone.utc),
        )
        db.add(user_consent)
    db.flush()

    # ========================================================================
    # Step 4: Create user profile
    # ========================================================================

    profile = UserProfile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        country=payload.country,
        primary_language=payload.primary_language,
        preferred_contribution_type=payload.preferred_contribution_type,
        has_speech_impairment=payload.has_speech_impairment,
        impairment_type=payload.impairment_type,
        can_read_sentences=not payload.has_speech_impairment,
        bio=payload.bio,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(profile)
    db.flush()

    # ========================================================================
    # Step 5: Create demographics record
    # ========================================================================

    demographics = UserDemographics(
        id=str(uuid.uuid4()),
        user_id=user_id,
        age_range=payload.age_range,
        gender=payload.gender,
        country_id=payload.country_id,
        region_id=payload.region_id,
        district=payload.district,
        native_language_id=payload.native_language_id,
        education_level=payload.education_level,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(demographics)
    db.flush()

    # ========================================================================
    # Step 6: Register speech conditions (if applicable)
    # ========================================================================

    if payload.has_speech_impairment and payload.speech_conditions:
        for speech_cond in payload.speech_conditions:
            user_speech = UserSpeechCondition(
                id=str(uuid.uuid4()),
                user_id=user_id,
                condition_id=speech_cond.condition_id,
                severity_level=speech_cond.severity_level,
                is_willing_to_contribute_for_research=speech_cond.is_willing_to_contribute_for_research,
                notes=speech_cond.notes,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user_speech)
    db.flush()

    # ========================================================================
    # Step 7: Generate dataset speaker ID & process language preferences
    # ========================================================================

    speaker_ids_created = []
    language_prefs_created = []

    for lang_pref in payload.language_preferences:
        # Get language to extract language code
        language = (
            db.query(Language)
            .filter(Language.id == lang_pref.language_id)
            .first()
        )
        if not language:
            raise HTTPException(status_code=400, detail="Invalid language selected")

        # Get country code from native_language country or primary region
        country_code = "UG"  # Default to Uganda for MVP
        if demographics.country_id:
            country = (
                db.query(Country)
                .filter(Country.id == demographics.country_id)
                .first()
            )
            if country:
                country_code = country.iso_code

        # Only create dataset speaker ID once per primary language
        if lang_pref.is_primary_language or not speaker_ids_created:
            # Find next sequence number for this country-language pair
            next_seq = (
                db.query(DatasetSpeakerId)
                .filter(
                    DatasetSpeakerId.country_code == country_code,
                    DatasetSpeakerId.language_code == language.iso_code,
                )
                .count()
            ) + 1

            speaker_code = generate_speaker_code(country_code, language.iso_code, next_seq)

            speaker_id = DatasetSpeakerId(
                id=str(uuid.uuid4()),
                user_id=user_id,
                speaker_code=speaker_code,
                country_code=country_code,
                language_code=language.iso_code,
                sequence_number=next_seq,
                created_at=datetime.now(timezone.utc),
            )
            db.add(speaker_id)
            db.flush()
            speaker_ids_created.append(speaker_id)

        # Create language preference
        lang_pref_obj = UserLanguagePreference(
            id=str(uuid.uuid4()),
            user_id=user_id,
            language_id=lang_pref.language_id,
            dialect_id=lang_pref.dialect_id,
            is_primary_language=lang_pref.is_primary_language,
            can_record=lang_pref.can_record,
            can_transcribe=lang_pref.can_transcribe,
            can_validate=lang_pref.can_validate,
            proficiency_level=lang_pref.proficiency_level,
            created_at=datetime.now(timezone.utc),
        )
        db.add(lang_pref_obj)
        db.flush()
        language_prefs_created.append(lang_pref_obj)

    # ========================================================================
    # Step 8: Create wallet
    # ========================================================================

    wallet = Wallet(
        id=str(uuid.uuid4()),
        user_id=user_id,
        balance=0.0,
        currency="USD",
        last_updated=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    db.add(wallet)

    # ========================================================================
    # Commit all
    # ========================================================================

    db.commit()
    db.refresh(user)
    db.refresh(profile)
    db.refresh(demographics)

    return {
        "user": UserSchema.model_validate(user),
        "profile": UserProfileSchema.model_validate(profile),
        "demographics": UserDemographicsSchema.model_validate(demographics),
        "speaker_id": DatasetSpeakerIdSchema.model_validate(speaker_ids_created[0] if speaker_ids_created else None),
        "language_preferences": [
            UserLanguagePreferenceSchema.model_validate(lp) for lp in language_prefs_created
        ],
        "message": "Signup successful! Welcome to ISDR.",
    }


@router.post("/signin", response_model=UserSchema)
def signin(payload: UserLoginRequest, db: Session = Depends(get_db)) -> User:
    """Sign in with email and password."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


# ============================================================================
# GET USER DETAILS
# ============================================================================


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user(user_id: str, db: Session = Depends(get_db)) -> User:
    """Get user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/{user_id}/profile", response_model=UserProfileSchema)
def get_user_profile(user_id: str, db: Session = Depends(get_db)) -> UserProfile:
    """Get user profile."""
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile


@router.get("/users/{user_id}/demographics", response_model=UserDemographicsSchema)
def get_user_demographics(user_id: str, db: Session = Depends(get_db)) -> UserDemographics:
    """Get user demographics."""
    demographics = (
        db.query(UserDemographics)
        .filter(UserDemographics.user_id == user_id)
        .first()
    )
    if not demographics:
        raise HTTPException(status_code=404, detail="User demographics not found")
    return demographics


@router.get("/users/{user_id}/language-preferences", response_model=list[UserLanguagePreferenceSchema])
def get_user_language_preferences(user_id: str, db: Session = Depends(get_db)) -> list[UserLanguagePreference]:
    """Get user language preferences."""
    return (
        db.query(UserLanguagePreference)
        .filter(UserLanguagePreference.user_id == user_id)
        .all()
    )


@router.get("/users/{user_id}/speech-conditions", response_model=list[UserSpeechConditionSchema])
def get_user_speech_conditions(user_id: str, db: Session = Depends(get_db)) -> list[UserSpeechCondition]:
    """Get user speech conditions (if applicable)."""
    return (
        db.query(UserSpeechCondition)
        .filter(UserSpeechCondition.user_id == user_id)
        .all()
    )


@router.get("/users/{user_id}/wallet", response_model=WalletSchema)
def get_user_wallet(user_id: str, db: Session = Depends(get_db)) -> Wallet:
    """Get user wallet."""
    wallet = (
        db.query(Wallet)
        .filter(Wallet.user_id == user_id)
        .first()
    )
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.get("/users/{user_id}/speaker-id", response_model=DatasetSpeakerIdSchema)
def get_user_speaker_id(user_id: str, db: Session = Depends(get_db)) -> DatasetSpeakerId:
    """Get user's privacy-preserving dataset speaker ID."""
    speaker_id = (
        db.query(DatasetSpeakerId)
        .filter(DatasetSpeakerId.user_id == user_id)
        .first()
    )
    if not speaker_id:
        raise HTTPException(status_code=404, detail="Speaker ID not found")
    return speaker_id
