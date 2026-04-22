from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

# ============================================================================
# 1. AUTHENTICATION & USER REGISTRATION
# ============================================================================


class UserSignupRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=5)
    phone_number: Optional[str] = Field(None, max_length=20)
    password: str = Field(min_length=8)
    auth_provider: Literal["local", "google", "github", "phone"] = "local"


class UserLoginRequest(BaseModel):
    email: str
    password: str


class AccessTokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class SigninResponseSchema(BaseModel):
    user: UserSchema
    token: AccessTokenSchema


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=5)
    onboarding_completed: Optional[bool] = None


class UserSchema(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: Optional[str]
    auth_provider: str
    is_verified: bool
    onboarding_completed: bool
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 2. CONSENT
# ============================================================================


class ConsentDocumentSchema(BaseModel):
    id: str
    title: str
    document_type: str
    version: str
    document_url: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserConsentRequest(BaseModel):
    document_id: str
    agreed: bool


class UserConsentSchema(BaseModel):
    id: str
    user_id: str
    document_id: str
    agreed: bool
    agreed_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 3. GEOGRAPHY & LANGUAGE
# ============================================================================


class CountrySchema(BaseModel):
    id: str
    country_name: str
    iso_code: str
    region: str

    model_config = {"from_attributes": True}


class RegionSchema(BaseModel):
    id: str
    country_id: str
    region_name: str

    model_config = {"from_attributes": True}


class DistrictSchema(BaseModel):
    id: str
    country_id: str
    region_id: Optional[str] = None
    district_name: str

    model_config = {"from_attributes": True}


class LanguageSchema(BaseModel):
    id: str
    language_name: str
    iso_code: str
    country_id: Optional[str] = None
    is_low_resource: bool
    speaker_count_approximate: Optional[int] = None

    model_config = {"from_attributes": True}


class DialectSchema(BaseModel):
    id: str
    language_id: str
    dialect_name: str
    region: Optional[str] = None
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SpeechConditionSchema(BaseModel):
    id: str
    condition_name: str
    description: str
    research_notes: Optional[str] = None

    model_config = {"from_attributes": True}


# ============================================================================
# 4. DEMOGRAPHICS & ACCESSIBILITY
# ============================================================================


class UserDemographicsRequest(BaseModel):
    age_range: Optional[Literal["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"]] = None
    gender: Optional[Literal["female", "male", "non_binary", "prefer_not_to_say"]] = None
    country_id: Optional[str] = None
    region_id: Optional[str] = None
    district_id: Optional[str] = None
    tribe_ethnicity: Optional[str] = None
    native_language_id: Optional[str] = None
    education_level: Optional[Literal["primary", "secondary", "university", "other", "prefer_not_to_say"]] = None


class UserDemographicsSchema(BaseModel):
    id: str
    user_id: str
    age_range: Optional[str]
    gender: Optional[str]
    country_id: Optional[str]
    region_id: Optional[str]
    district_id: Optional[str]
    tribe_ethnicity: Optional[str]
    native_language_id: Optional[str]
    education_level: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserSpeechConditionRequest(BaseModel):
    condition_id: str
    severity_level: Literal["mild", "moderate", "severe"] = "mild"
    is_willing_to_contribute_for_research: bool = False
    notes: Optional[str] = None


class UserSpeechConditionSchema(BaseModel):
    id: str
    user_id: str
    condition_id: str
    severity_level: str
    is_willing_to_contribute_for_research: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 5. LANGUAGE PREFERENCES
# ============================================================================


class UserLanguagePreferenceRequest(BaseModel):
    language_id: str
    dialect_id: Optional[str] = None
    is_primary_language: bool = False
    can_record: bool = False
    can_transcribe: bool = False
    can_validate: bool = False
    proficiency_level: Literal["native", "fluent", "intermediate", "beginner"] = "native"

    @model_validator(mode="after")
    def validate_proficiency_level(self) -> "UserLanguagePreferenceRequest":
        if not self.is_primary_language and self.proficiency_level == "native":
            raise ValueError("Secondary languages require a self-rated fluency level")
        return self


class UserLanguagePreferencesUpdateRequest(BaseModel):
    language_preferences: list[UserLanguagePreferenceRequest]


class UserLanguagePreferenceSchema(BaseModel):
    id: str
    user_id: str
    language_id: str
    dialect_id: Optional[str]
    is_primary_language: bool
    can_record: bool
    can_transcribe: bool
    can_validate: bool
    proficiency_level: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 6. USER PROFILE
# ============================================================================


class UserProfileRequest(BaseModel):
    country: Optional[str] = None
    primary_language: Optional[str] = None
    preferred_contribution_type: Literal["recording", "validation", "transcription"] = "recording"
    has_speech_impairment: bool = False
    impairment_type: Optional[str] = None
    can_read_sentences: bool = True
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    country: Optional[str] = None
    primary_language: Optional[str] = None
    preferred_contribution_type: Optional[Literal["recording", "validation", "transcription"]] = None
    has_speech_impairment: Optional[bool] = None
    impairment_type: Optional[str] = None
    can_read_sentences: Optional[bool] = None
    bio: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserProfileSchema(BaseModel):
    id: str
    user_id: str
    country: Optional[str]
    primary_language: Optional[str]
    preferred_contribution_type: str
    has_speech_impairment: bool
    impairment_type: Optional[str]
    can_read_sentences: bool
    bio: Optional[str]
    profile_photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 7. DATASET SPEAKER ID
# ============================================================================


class DatasetSpeakerIdSchema(BaseModel):
    id: str
    user_id: str
    speaker_code: str
    country_code: str
    language_code: str
    sequence_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 8. FULL SIGNUP FLOW
# ============================================================================


class FullSignupRequest(BaseModel):
    """Complete registration with all steps."""
    # Step 1: Account
    full_name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=5)
    phone_number: Optional[str] = Field(None, max_length=20)
    password: str = Field(min_length=8)

    # Step 2: Consent
    consents: list[UserConsentRequest]

    # Step 3: Profile
    country: Optional[str] = None
    primary_language: Optional[str] = None
    preferred_contribution_type: Literal["recording", "validation", "transcription"] = "recording"
    has_speech_impairment: bool = False
    impairment_type: Optional[str] = None
    can_read_sentences: bool = True
    bio: Optional[str] = None

    # Step 4: Demographics
    age_range: Optional[Literal["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"]] = None
    gender: Optional[Literal["female", "male", "non_binary", "prefer_not_to_say"]] = None
    country_id: Optional[str] = None
    region_id: Optional[str] = None
    district_id: Optional[str] = None
    tribe_ethnicity: Optional[str] = None
    native_language_id: Optional[str] = None
    education_level: Optional[Literal["primary", "secondary", "university", "other", "prefer_not_to_say"]] = None

    # Step 5: Speech conditions (if applicable)
    speech_conditions: Optional[list[UserSpeechConditionRequest]] = None

    # Step 6: Language preferences
    language_preferences: list[UserLanguagePreferenceRequest]

    @model_validator(mode="after")
    def validate_accessibility_fields(self) -> "FullSignupRequest":
        if self.has_speech_impairment:
            if not self.impairment_type:
                raise ValueError("impairment_type is required when has_speech_impairment is true")
            if not self.speech_conditions:
                raise ValueError("speech_conditions are required when has_speech_impairment is true")
        return self


class SignupResponseSchema(BaseModel):
    """Response after successful registration."""
    user: UserSchema
    profile: UserProfileSchema
    demographics: UserDemographicsSchema
    speaker_id: DatasetSpeakerIdSchema
    language_preferences: list[UserLanguagePreferenceSchema]
    token: AccessTokenSchema
    message: str


# ============================================================================
# 9. WALLET & FINANCIAL
# ============================================================================


class WalletSchema(BaseModel):
    id: str
    user_id: str
    balance: float
    currency: str
    last_updated: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class DonationSchema(BaseModel):
    id: str
    donor_id: str
    amount: float
    currency: str
    target_type: str
    target_id: Optional[str]
    status: str
    payment_method: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RewardPoolSchema(BaseModel):
    id: str
    language_id: str
    pool_name: str
    total_amount: float
    amount_distributed: float
    reward_per_recording: float
    reward_per_validation: float
    reward_per_transcription: float
    reward_per_expert_review: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RewardTransactionSchema(BaseModel):
    id: str
    user_id: str
    pool_id: str
    task_type: str
    task_id: str
    amount: float
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 10. TRANSCRIPTION WORKFLOW
# ============================================================================


class TranscriptionQueueItemSchema(BaseModel):
    id: str
    recording_id: str
    user_id: str
    language_id: str
    audio_url: str
    status: str
    speaker_type: str
    transcript_count: int
    validation_count: int
    eligible_validator_ids: list[str] = Field(default_factory=list)
    eligible_validator_count: int = 0
    latest_transcription: Optional[str] = None
    latest_confidence_score: Optional[float] = None
    prompt_text: Optional[str] = None

    model_config = {"from_attributes": True}


class TranscriptionTaskCreateRequest(BaseModel):
    recording_id: str
    transcriber_id: str
    transcribed_text: str = Field(min_length=1)
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class TranscriptionTaskSchema(BaseModel):
    id: str
    recording_id: str
    transcriber_id: str
    transcribed_text: str
    confidence_score: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TranscriptionValidationCreateRequest(BaseModel):
    transcription_id: str
    validator_id: str
    rating: int = Field(ge=1, le=5)
    is_correct: bool
    suggested_correction: Optional[str] = None
    comments: Optional[str] = None
    deep_cultural_meaning: Optional[str] = None


class TranscriptionValidationSchema(BaseModel):
    id: str
    transcription_id: str
    validator_id: str
    rating: int
    is_correct: bool
    suggested_correction: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class GraduateTranscriptionRequest(BaseModel):
    expert_id: str
    is_approved: bool = True
    corrected_text: Optional[str] = None
    quality_tier: Literal["Standard", "High", "Reference"] = "Standard"
    condition_annotation: Optional[str] = None
    notes: str = Field(min_length=1)
    add_to_dictionary: bool = False
    dictionary_word: Optional[str] = None
    phoneme_representation: Optional[str] = None


class PromptBankEntrySchema(BaseModel):
    id: str
    language_id: str
    dialect_id: Optional[str] = None
    sentence_text: str
    domain: str
    source_type: str
    is_verified: bool
    created_by: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ImagePromptSchema(BaseModel):
    id: str
    image_url: str = Field(min_length=1)
    instruction_text: str = Field(min_length=1)
    is_active: bool = True

    model_config = {"from_attributes": True}


class TranslationQueueItemSchema(BaseModel):
    transcription_id: str
    recording_id: str
    source_language_id: str
    transcribed_text: str
    translation_count: int
    latest_translation: Optional[str] = None


class TranslationTaskCreateRequest(BaseModel):
    transcription_id: str
    translator_id: str
    target_language_code: str = Field(min_length=2, max_length=10)
    translated_text: str = Field(min_length=1)


class TranslationTaskSchema(BaseModel):
    id: str
    transcription_id: str
    translator_id: str
    target_language_code: str
    translated_text: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SourceTranslationQueueItemSchema(BaseModel):
    id: str
    source_sentence_id: str
    source_text: str
    source_language_id: str
    target_language_id: str
    target_language_code: str
    target_language_name: str
    machine_prefill_text: Optional[str] = None
    prefill_provider: Optional[str] = None
    prefill_confidence: Optional[float] = None
    translated_text: Optional[str] = None
    reviewed_text: Optional[str] = None
    validation_count: int = 0
    approval_count: int = 0
    status: str
    updated_at: datetime


class SourceTranslationSubmitRequest(BaseModel):
    translator_id: str
    translated_text: str = Field(min_length=1)


class SourceTranslationReviewRequest(BaseModel):
    reviewer_id: str
    approved: bool
    reviewed_text: Optional[str] = None
    notes: Optional[str] = None


class SourceTranslationValidationRequest(BaseModel):
    validator_id: str
    is_valid: bool
    notes: Optional[str] = None


# ============================================================================
# 10A. CONTRIBUTOR SUBMISSION & TRANSLATION
# ============================================================================


class SubmissionCreateRequest(BaseModel):
    """Contribution submission with optional transcription and translations."""

    contributor_id: str
    language_code: str
    native_language_code: str
    target_language_code: str
    mode: Literal["prompted", "recording", "read_out", "spontaneous_image"]
    category: Literal["proverb", "idiom", "common_saying", "riddle", "photo_description"]
    speaker_profile: str
    consent_version: str
    hometown: Optional[str] = None
    residence: Optional[str] = None
    tribe_ethnicity: Optional[str] = None
    gender: Optional[str] = None
    age_group: Optional[str] = None
    pair_group_id: Optional[str] = None
    riddle_part: Optional[Literal["challenge", "reveal"]] = None
    challenge_submission_id: Optional[str] = None
    reveal_submission_id: Optional[str] = None
    target_word: Optional[str] = None
    read_prompt: Optional[str] = None
    image_prompt_url: Optional[str] = None
    spontaneous_instruction: Optional[str] = None
    audio_url: Optional[str] = None
    cid: Optional[str] = None
    contributor_transcription: Optional[str] = Field(None, min_length=1)
    translations: Optional[list["ContributorTranslationSubmitRequest"]] = None


class SubmissionResponse(BaseModel):
    """Response when submission is created/retrieved."""

    id: str
    contributor_id: str
    language_code: str
    native_language_code: str
    target_language_code: str
    mode: str
    category: str
    status: str
    speaker_profile: str
    consent_version: str
    audio_url: Optional[str] = None
    contributor_transcription: Optional[str] = None
    aggregate_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributorTranslationSubmitRequest(BaseModel):
    """Translation submitted by contributor with original submission."""

    source_language_code: str
    target_language_code: str
    source_text: str = Field(min_length=1)
    translated_text: str = Field(min_length=1)


class ContributorTranslationSchema(BaseModel):
    """Response schema for contributor translations."""

    id: str
    submission_id: str
    source_language_code: str
    target_language_code: str
    source_text: str
    translated_text: str
    translator_id: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordingCreateRequest(BaseModel):
    user_id: str
    language_id: str
    dialect_id: Optional[str] = None
    sentence_id: Optional[str] = None
    audio_url: str = Field(min_length=1)
    duration_seconds: float = Field(gt=0)
    audio_quality_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    speaker_type: Literal["normal", "impaired"] = "normal"
    recording_device: str = Field(default="mobile", max_length=50)
    noise_level: str = Field(default="quiet", max_length=50)


class RecordingSchema(BaseModel):
    id: str
    user_id: str
    sentence_id: Optional[str]
    language_id: str
    dialect_id: Optional[str]
    audio_url: str
    duration_seconds: float
    audio_quality_score: Optional[float]
    speaker_type: str
    recording_device: str
    noise_level: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpertReviewCreateRequest(BaseModel):
    expert_id: str
    is_approved: bool = True
    corrected_text: Optional[str] = None
    quality_tier: Literal["Standard", "High", "Reference"] = "Standard"
    condition_annotation: Optional[str] = None
    notes: str = Field(min_length=1)
    add_to_dictionary: bool = False
    dictionary_word: Optional[str] = None
    phoneme_representation: Optional[str] = None


class ExpertReviewSchema(BaseModel):
    id: str
    recording_id: str
    expert_id: str
    is_approved: bool
    corrected_text: Optional[str]
    quality_tier: str
    condition_annotation: Optional[str]
    notes: str
    added_to_dictionary: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DatasetEntrySchema(BaseModel):
    id: str
    recording_id: str
    speaker_id: str
    final_transcription: str
    speaker_type: str
    quality_tier: str
    dataset_version: str
    added_at: datetime

    model_config = {"from_attributes": True}


class PronunciationDictionaryCreateRequest(BaseModel):
    word: str = Field(min_length=1, max_length=255)
    language_id: str
    dialect_id: Optional[str] = None
    phoneme_representation: str = Field(min_length=1, max_length=500)
    audio_reference_id: Optional[str] = None
    verified_by: str


class PronunciationDictionarySchema(BaseModel):
    id: str
    word: str
    language_id: str
    dialect_id: Optional[str]
    phoneme_representation: str
    audio_reference_id: Optional[str]
    verified_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# 11. ADMIN MANAGEMENT
# ============================================================================


class AdminRoleUpdateRequest(BaseModel):
    admin_user_id: str
    role: Literal["contributor", "expert", "admin"]


class AdminLanguageCapabilityUpdateRequest(BaseModel):
    admin_user_id: str
    language_id: str
    dialect_id: Optional[str] = None
    is_primary_language: Optional[bool] = None
    can_record: Optional[bool] = None
    can_transcribe: Optional[bool] = None
    can_validate: Optional[bool] = None
    proficiency_level: Optional[Literal["native", "fluent", "intermediate", "beginner"]] = None

    @model_validator(mode="after")
    def validate_proficiency_level(self) -> "AdminLanguageCapabilityUpdateRequest":
        if self.is_primary_language is True and self.proficiency_level not in (None, "native"):
            raise ValueError("Primary languages must be marked as native")
        if self.is_primary_language is False and self.proficiency_level in (None, "native"):
            raise ValueError("Secondary languages require a self-rated fluency level")
        return self
