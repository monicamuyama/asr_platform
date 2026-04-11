# ISDR Implementation Strategy (Extended Runtime)

## 1) Objective
Operate a single, research-grade runtime that supports:
- Full signup/authentication with consent enforcement
- Inclusive contributor onboarding for normal and impaired speech
- Recording ingestion tied to language permissions
- End-to-end transcription and translation workflow
- Expert graduation into dataset + pronunciation dictionary
- Privacy-preserving speaker identities for published data

## 2) Active Architecture
- Backend: FastAPI
- Persistence: SQLAlchemy extended schema
- API domains:
  - `/auth/*` for signup, profile context, consent, geography/language reference data
  - `/transcription/*` for recording, queueing, transcription, validation, translation, graduation

Legacy submission/community/tips/governance runtime is retired from active routing.

## 3) Extended Pipeline (Implemented)

### Stage A: User Signup and Readiness
1. `POST /auth/signup`
2. Validate unique email/phone
3. Validate all active consent documents are accepted
4. Create user, consent records, profile, demographics
5. Register speech-condition metadata when provided
6. Create language preferences with capabilities
7. Generate dataset speaker code (for example `UG-LG-000001`)
8. Create wallet

### Stage B: Recording Ingestion
1. `POST /transcription/recordings`
2. Enforce `can_record` language capability
3. Validate sentence-language consistency when a sentence prompt is supplied
4. Persist recording in `pending_transcription`

### Stage C: Transcription Work
1. `GET /transcription/queue` to list pending items
2. `POST /transcription/tasks` to submit or update a transcription
3. Recording moves to `transcribed`

### Stage D: Peer Validation
1. `POST /transcription/tasks/{task_id}/validations`
2. Enforce `can_validate` language capability
3. Require at least 2 validations and graduation threshold (average rating >= 4, at least one `is_correct=true`)

### Stage E: Translation
1. `GET /transcription/translation-queue`
2. `POST /transcription/tasks/{task_id}/translations`
3. At least one translation required before graduation

### Stage F: Expert Graduation
1. `POST /transcription/tasks/{task_id}/graduate`
2. Only `expert`/`admin` can graduate
3. On approval:
   - Create/update verified prompt-bank sentence
   - Create dataset entry bound to privacy-safe speaker ID
   - Optionally create pronunciation dictionary entry
   - Mark recording and task as `graduated`
4. On rejection:
   - Mark task and recording as expert rejected

## 4) Data Integrity Rules
- Capability checks are language-scoped (`record`, `transcribe`, `validate`)
- Dataset publication requires speaker ID and expert graduation
- Dictionary entry creation requires explicit phoneme payload
- Consent completion required at onboarding

## 5) Legacy Cleanup Policy
- Extended runtime is the only mounted API surface
- Old minimal endpoints are removed from routing and tests
- Legacy modules are deleted when no active import references remain

## 6) Verification Baseline
- Integration tests verify:
  - Signup creates user + speaker ID
  - Recording-to-graduation pipeline creates dataset and dictionary artifacts
  - Permission failures (for example missing `can_record`) are enforced

## 7) Immediate Implementation Next Steps
1. Add reward-distribution hooks at graduation for recording/transcription/validation payouts.
2. Add authentication tokens and role guards for all write endpoints.
3. Add idempotency keys for recording upload and graduation operations.
4. Expand tests for rejection paths, duplicate submissions, and dictionary conflicts.
