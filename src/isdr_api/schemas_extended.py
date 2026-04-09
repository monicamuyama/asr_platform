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
