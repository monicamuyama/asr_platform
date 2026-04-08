# ISDR Implementation Strategy (MVP -> V1)

> Archived planning note: this strategy targets an earlier MVP workflow.
> The active runtime is extended-only and uses `/auth/*` endpoints.

## 1) Goal
Build a production-oriented MVP of the Inclusive Speech Data Refinery (ISDR) that supports:
- Contributor audio submission with metadata
- Tier-1 community validation with quorum + thresholds
- Tier-2 expert validation with accept/reject + annotation
- Provenance-aware storage references (CID-first model)
- Governance-configurable rating/threshold parameters

The MVP excludes on-chain settlement/payments at first, but keeps interfaces ready for a later Proof-of-Quality integration.

## 2) Product Scope
### In scope (MVP)
- User roles: Contributor, Community Validator, Expert Validator, Admin
- Audio upload workflow with task mode: prompted/read/spontaneous
- Metadata capture: language, speaker profile, elicitation mode, consent version
- Community rating (3 dimensions, 1-5 scale)
- Quorum aggregation (trimmed mean) and routing logic (reject/hold/forward)
- Expert review queue with final decision and annotation
- Corpus listing for accepted samples with filterable metadata
- Audit trail of validation events

### Out of scope (MVP)
- Blockchain payments and wallet onboarding
- Advanced anti-gaming/reputation weighting
- Multi-tenant federation across regions
- Full transcription pipeline

## 3) Proposed Technical Architecture
### 3.1 Components
- `web-app`: contributor/validator/expert/admin UI
- `api-service`: auth, submission, routing, validation, governance-config endpoints
- `worker-service`: async processing (queue routing, aggregation, notifications)
- `db`: relational database for users, metadata, ratings, governance configs, audit events
- `object-storage`: audio file storage (CID-compatible addressing design)

### 3.2 Recommended stack (fast delivery)
- Frontend: React + TypeScript
- Backend: FastAPI (Python) + Pydantic
- Database: PostgreSQL
- Queue: Redis + RQ/Celery
- Storage: S3-compatible store (CID field persisted now; IPFS bridge later)

## 4) Data Model (Core)
- `users(id, role, language_communities, status)`
- `submissions(id, contributor_id, language_code, mode, speaker_profile, audio_url, cid, consent_version, status)`
- `community_ratings(id, submission_id, rater_id, intelligibility, recording_quality, elicitation_compliance, weighted_score)`
- `expert_reviews(id, submission_id, expert_id, decision, quality_tier, condition_annotation, notes)`
- `governance_params(id, community_key, quorum_q, theta_reject, theta_accept, w_intelligibility, w_recording, w_compliance, active_from)`
- `audit_events(id, actor_id, entity_type, entity_id, action, payload, created_at)`

## 5) Routing Logic (MVP)
1. Submission enters `PENDING_COMMUNITY`.
2. Gather at least `Q` independent ratings.
3. Compute per-rater weighted score:
   - score = w_i*i + w_r*r + w_c*c
4. Compute trimmed mean across Q scores (drop min and max).
5. If score < theta_reject -> `REJECTED_COMMUNITY`.
6. If theta_reject <= score < theta_accept -> `HOLD_COMMUNITY` (request more ratings).
7. If score >= theta_accept -> `PENDING_EXPERT`.
8. Expert accepts -> `ACCEPTED`; else `REJECTED_EXPERT` with feedback.

## 6) Delivery Plan
### Phase 0 (Week 1): Foundations
- Finalize MVP schema + role permissions
- Initialize repo structure and CI
- Implement auth + role model

### Phase 1 (Week 2): Submission + Metadata
- Upload endpoint + storage integration
- Submission form for prompted/read/spontaneous
- Consent versioning on submission

### Phase 2 (Week 3): Community Validation
- Community queue generation and assignment
- 3-dimension rating UI and API
- Quorum + trimmed-mean routing worker

### Phase 3 (Week 4): Expert Validation + Corpus View
- Expert review queue + annotation schema
- Final decision flow and contributor feedback
- Accepted corpus search/filter screen

### Phase 4 (Week 5): Governance Parameters + Audit
- Community-specific parameter management UI/API
- Versioned governance parameter activation
- Full validation audit log export

## 7) Quality & Risk Controls
- Prevent self-rating and duplicate rater votes
- Enforce independent-rater constraints at DB and service layers
- Add calibration samples for raters before first reviews
- Log all routing decisions with deterministic calculation payload
- Add feature flags for high-risk modules (threshold changes)

## 8) Success Metrics (MVP)
- Median submission-to-final-decision < 48h
- Community rating completion rate > 85%
- Expert rejections after community accept < 25% (calibration indicator)
- Zero missing-provenance records for accepted submissions

## 9) Immediate Next Step
Start with domain and API contracts so frontend and backend can work in parallel.
