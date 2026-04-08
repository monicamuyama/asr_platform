# ISDR MVP Product Spec

> Archived planning note: this document describes an earlier MVP workflow.
> The current implementation is extended-only and centered on `/auth/*` endpoints.

## Problem Statement
Low-resource language speakers and speakers with speech/language disorders are poorly represented in ASR training corpora due to centralized collection and non-contextual quality filtering.

## MVP Objective
Ship a usable platform that validates speech data through two human tiers and stores accepted samples with complete provenance metadata.

## Users and Jobs
- Contributor: record and submit utterances with correct metadata and consent.
- Community Validator: rate sample quality quickly and consistently.
- Expert Validator: provide final quality gate and condition-aware annotation.
- Admin: configure governance parameters and monitor system health.

## Functional Requirements
1. Authentication and role-based access.
2. Submission intake for three elicitation modes.
3. Metadata capture and validation for every submission.
4. Community rating workflow with quorum enforcement.
5. Weighted aggregation + threshold routing.
6. Expert review workflow with binary final decision.
7. Corpus explorer for accepted submissions.
8. Audit event record for every state transition.

## Non-Functional Requirements
- Deterministic routing decisions (same inputs -> same output).
- End-to-end traceability for provenance and moderation actions.
- API-first design for extensibility.
- Mobile-friendly UI for contributor-heavy usage.

## Acceptance Criteria (MVP)
- A contributor can submit audio and see status updates.
- A community validator can rate assigned submissions and cannot rate own sample.
- System auto-routes on quorum completion based on active governance config.
- Expert can approve/reject with annotation; decision is persisted and visible.
- Admin can change thresholds/weights with versioned activation date.
- Accepted samples are searchable with metadata filters.
