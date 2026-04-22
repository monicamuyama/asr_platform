# ISDR Complete Database Schema Design

## Overview

Research-grade speech corpus collection platform supporting:
- Normal speech + impaired speech contributors
- Multi-stage validation workflow (community → expert → dictionary)
- Multilingual ASR (starting with Uganda)
- Donations + reward pools
- Legal consent + demographics
- Privacy-preserving dataset speaker IDs

---

## 1. USER & AUTHENTICATION

### users
Core authentication & identity.

```sql
id (uuid, PK)
full_name
email (unique)
phone_number (unique, nullable)
password_hash
auth_provider (local, google, github, phone)
is_verified (boolean)
role (contributor, validator, expert, admin, donor) -- default 'contributor'
created_at
updated_at
```

### user_profiles
Accessibility profile & preferences.

```sql
id (uuid, PK)
user_id (fk -> users.id)

country
primary_language
preferred_contribution_type (recording, validation, transcription)

has_speech_impairment (boolean, default false)
impairment_type (stutter, dysarthria, apraxia, voice_disorder, other, nullable)
can_read_sentences (boolean, default true)

bio
profile_photo_url

created_at
updated_at
```

### user_demographics
Research-grade demographic data (separate from identity for privacy).

```sql
id (uuid, PK)
user_id (fk -> users.id, unique)

age_range (under_18, 18_24, 25_34, 35_44, 45_54, 55_plus)
gender (female, male, non_binary, prefer_not_to_say)

country_id (fk -> countries.id)
region_id (fk -> regions.id, nullable)
district (text, nullable)

native_language_id (fk -> languages.id)
education_level (primary, secondary, university, other, prefer_not_to_say)

created_at
updated_at
```

### user_speech_conditions
Maps users with speech disorders to research profile.

```sql
id (uuid, PK)
user_id (fk -> users.id)
condition_id (fk -> speech_conditions.id)

severity_level (mild, moderate, severe)
is_willing_to_contribute_for_research (boolean, default false)
notes (text, nullable)

created_at
```

---

## 2. CONSENT & LEGAL

### consent_documents
Legal document versioning.

```sql
id (uuid, PK)
title
document_type (privacy_policy, data_usage, research_consent, voice_recording_consent)
version
document_url
content_hash (for integrity verification)
created_at
is_active (boolean)
```

### user_consents
Proof of user consent (legally binding).

```sql
id (uuid, PK)
user_id (fk -> users.id)
document_id (fk -> consent_documents.id)

agreed (boolean)
agreed_at
ip_address
user_agent

created_at
```

---

## 3. GEOGRAPHY & LANGUAGE

### countries

```sql
id (uuid, PK)
country_name
iso_code (unique)
region (Africa, Asia, Europe, Americas)
created_at
```

### regions

```sql
id (uuid, PK)
country_id (fk -> countries.id)
region_name

created_at
```

### languages

```sql
id (uuid, PK)
language_name
iso_code (unique)
country_id (fk -> countries.id, nullable for global languages)

is_low_resource (boolean, default false)
speaker_count_approximate (int, nullable)

created_at
```

### dialects

```sql
id (uuid, PK)
language_id (fk -> languages.id)
dialect_name
region (text, nullable)
description

created_at
```

---

## 4. USER LANGUAGE PREFERENCES

### user_language_preferences
User can contribute to multiple languages.

```sql
id (uuid, PK)
user_id (fk -> users.id)
language_id (fk -> languages.id)
dialect_id (fk -> dialects.id, nullable)

is_primary_language (boolean)
can_record (boolean, default false)
can_transcribe (boolean, default false)
can_validate (boolean, default false)

proficiency_level (native, fluent, intermediate, beginner)

created_at
```

---

## 5. CORPUS & SENTENCE POOL

### sentence_corpus
Sentences that users read or transcribe.

```sql
id (uuid, PK)
language_id (fk -> languages.id)
dialect_id (fk -> dialects.id, nullable)

sentence_text
domain (education, health, agriculture, casual, technical)
source_type (community, generated, expert, public_domain)

is_verified (boolean)
created_by (fk -> users.id)

created_at
```

### speech_conditions
Reference table for speech impairments.

```sql
id (uuid, PK)
condition_name (stutter, dysarthria, apraxia, voice_disorder, other)
description
research_notes (text, nullable)

created_at
```

---

## 6. SPEECH CONTRIBUTIONS

### recordings
Raw audio contributions.

```sql
id (uuid, PK)
user_id (fk -> users.id)
sentence_id (fk -> sentence_corpus.id, nullable)
language_id (fk -> languages.id)
dialect_id (fk -> dialects.id, nullable)

audio_url
duration_seconds
audio_quality_score (0-100, nullable)

speaker_type (normal, impaired_speech)
recording_device (mobile, laptop, studio, other)
noise_level (silent, quiet, moderate, loud)

status (new, validating, approved, rejected, expert_review, verified, in_dataset)

created_at
updated_at
```

---

## 7. VALIDATION PIPELINE

### validation_tasks
Community validation of audio quality.

```sql
id (uuid, PK)
recording_id (fk -> recordings.id)
validator_id (fk -> users.id)

rating (1-5)
is_clear_audio (boolean)
is_correct_sentence (boolean, nullable)
comments (text, nullable)

created_at
```

### transcription_tasks
Community transcription of audio.

```sql
id (uuid, PK)
recording_id (fk -> recordings.id)
transcriber_id (fk -> users.id)

transcribed_text
confidence_score (0-100, nullable)
status (pending, approved, rejected)

created_at
updated_at
```

### transcription_validation
Validation of transcriptions.

```sql
id (uuid, PK)
transcription_id (fk -> transcription_tasks.id)
validator_id (fk -> users.id)

rating (1-5)
is_correct (boolean)
suggested_correction (text, nullable)
comments (text, nullable)

created_at
```

---

## 8. EXPERT REVIEW

### expert_reviews
Final review before dictionary addition.

```sql
id (uuid, PK)
recording_id (fk -> recordings.id)
expert_id (fk -> users.id)

is_approved (boolean)
corrected_text (text, nullable)
quality_tier (Standard, High, Reference)
condition_annotation (text, nullable)
notes (text)

added_to_dictionary (boolean, default false)

created_at
updated_at
```

---

## 9. DICTIONARY & DATASET

### pronunciation_dictionary
Verified pronunciations for words/phrases.

```sql
id (uuid, PK)
word
language_id (fk -> languages.id)
dialect_id (fk -> dialects.id, nullable)

phoneme_representation
audio_reference_id (fk -> recordings.id)
verified_by (fk -> users.id)

created_at
```

### dataset_entries
Approved recordings added to public dataset.

```sql
id (uuid, PK)
recording_id (fk -> recordings.id, unique)
speaker_id (fk -> dataset_speaker_ids.id)

final_transcription
speaker_type (normal, impaired)
quality_tier (Standard, High, Reference)
dataset_version

added_at
```

### dataset_speaker_ids
Privacy-preserving speaker identifiers for published datasets.

```sql
id (uuid, PK)
user_id (fk -> users.id, unique)
speaker_code (unique, format: UG-ACH-000245)

country_code (2-letter ISO)
language_code (3-letter ISO)
sequence_number

created_at
```

---

## 10. FINANCIAL SYSTEM

### wallets
User account balance.

```sql
id (uuid, PK)
user_id (fk -> users.id, unique)

balance (decimal, default 0.00)
currency (USD, EUR, GBP, UGX, etc.)
last_updated

created_at
```

### donations
One-time or recurring donations.

```sql
id (uuid, PK)
donor_id (fk -> users.id)

amount (decimal)
currency
target_type (platform, dataset, language_pool, user)
target_id (uuid, nullable)

status (pending, completed, failed, refunded)
payment_method (stripe, paypal, bank_transfer, crypto)
stripe_transaction_id (nullable)

created_at
updated_at
```

### tips
Monetary appreciation for contributors.

```sql
id (uuid, PK)
recording_id (fk -> recordings.id)
contributor_id (fk -> users.id)
tipper_id (fk -> users.id)

amount (decimal)
rating (1-5)
currency
message (text, nullable)

created_at
```

### reward_pools
Language-specific incentive pools.

```sql
id (uuid, PK)
language_id (fk -> languages.id)

pool_name
total_amount (decimal)
amount_distributed (decimal, default 0)

reward_per_recording (decimal)
reward_per_validation (decimal)
reward_per_transcription (decimal)
reward_per_expert_review (decimal)

is_active (boolean)
created_at
expired_at (nullable)
```

### reward_transactions
Individual reward payouts.

```sql
id (uuid, PK)
user_id (fk -> users.id)
pool_id (fk -> reward_pools.id)

task_type (recording, validation, transcription, expert_review)
task_id (uuid)

amount (decimal)
currency

created_at
```

---

## 11. AUDIT & ANALYTICS

### audit_events
Track all major actions for compliance.

```sql
id (uuid, PK)
actor_id (fk -> users.id)
entity_type (recording, validation, expert_review, donation)
entity_id (uuid)
action (create, update, approve, reject, publish)
payload (jsonb, nullable)

created_at
```

### dataset_analytics
Track dataset usage.

```sql
id (uuid, PK)
dataset_entry_id (fk -> dataset_entries.id)

download_count (int, default 0)
last_accessed (timestamp, nullable)
research_project_name (text, nullable)

created_at
```

---

## 12. INDEXES

For performance:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);

-- Recording queries
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_language_id ON recordings(language_id);
CREATE INDEX idx_recordings_status ON recordings(status);

-- Validation workflow
CREATE INDEX idx_validation_tasks_recording_id ON validation_tasks(recording_id);
CREATE INDEX idx_transcription_tasks_recording_id ON transcription_tasks(recording_id);
CREATE INDEX idx_expert_reviews_recording_id ON expert_reviews(recording_id);

-- Dataset
CREATE INDEX idx_dataset_entries_recording_id ON dataset_entries(recording_id);
CREATE INDEX idx_dataset_entries_speaker_id ON dataset_entries(speaker_id);

-- Financial
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_tips_contributor_id ON tips(contributor_id);
CREATE INDEX idx_reward_transactions_user_id ON reward_transactions(user_id);

-- Consent
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
```

---

## 13. CONSTRAINTS & BUSINESS RULES

1. **Consent Required**: No user can contribute without accepted current consents.
2. **Language Preference**: Users must select at least one language to contribute.
3. **Validation Quorum**: Recording requires 3+ validation ratings to pass.
4. **Transcription Approval**: Transcription requires 2+ approvals before expert review.
5. **Unique Dataset IDs**: Each user gets exactly one speaker_code per country-language pair.
6. **Self-Exclusion**: Users cannot validate/transcribe their own recordings.
7. **Reward Pool Depletion**: Rewards only distributed while pool has funds.
8. **Archive Policy**: After 2 years, inactive user data can be anonymized.

---

## 14. MIGRATION STRATEGY

From current minimal schema to full schema:

1. Add user authentication & demographics (Phase 1)
2. Add governance & consent (Phase 2)
3. Add expanded validation pipeline (Phase 3)
4. Add financial system (Phase 4)
5. Add dataset & analytics (Phase 5)
