# ISDR Backlog (Execution Starter)

> Archived planning note: this backlog tracks legacy MVP workflow items.
> The current app flow is extended-only via `/auth/*` endpoints.

## Sprint 1: Platform Skeleton + Auth
- [ ] Create monorepo structure (`web-app`, `api-service`, `worker-service`).
- [ ] Add Docker Compose for PostgreSQL + Redis.
- [ ] Implement user model with roles.
- [ ] Add JWT auth endpoints and protected routes.
- [ ] Add migration pipeline and baseline schema.

## Sprint 2: Submission Pipeline
- [ ] Create submission endpoint and metadata validators.
- [ ] Implement audio upload to object storage.
- [ ] Add contributor submission UI (mode + metadata + consent).
- [ ] Add submission status tracking endpoint.

## Sprint 3: Community Validation
- [ ] Build assignment query for community validation queue.
- [ ] Add rating endpoint with anti-self-rating guard.
- [ ] Add weighted score calculation service.
- [ ] Add quorum-complete worker and trimmed-mean aggregation.
- [ ] Add hold/forward/reject state transitions.

## Sprint 4: Expert Validation + Corpus
- [ ] Build expert queue endpoints.
- [ ] Add expert review + annotation payload schema.
- [ ] Implement final decision transition and contributor feedback events.
- [ ] Add accepted corpus listing with filters.

## Sprint 5: Governance + Audit
- [ ] Create governance parameter versioning model.
- [ ] Add admin UI/API for threshold/weight updates.
- [ ] Ensure active parameter resolution by community and timestamp.
- [ ] Add audit log query/export endpoint.

## Technical Debt / Later
- [ ] IPFS pinning service and CID verification worker.
- [ ] Reputation-weighted community ratings.
- [ ] Appeals workflow with second/third expert review.
- [ ] PoQ blockchain settlement adapter interface.
