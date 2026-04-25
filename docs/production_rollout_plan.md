# Production Rollout Plan

This plan is tailored to the current stack:
- Frontend: Netlify (project in ui)
- Backend API: Railway (FastAPI)
- Data: Railway PostgreSQL
- Cache/queue: Railway Redis
- Object storage: AWS S3

## 1. Principles

- Security by default: deny-by-default network and policy settings.
- Least privilege: every token/key has minimum required scope.
- Reliability first: no deploy without rollback path and health checks.
- Shift-left quality: CI gates before merge and before deployment.
- Progressive delivery: staged rollout with observability and fast rollback.
- Usability as a release gate: key user journeys must pass before go-live.

## 2. Current Gaps Observed In Code

- API CORS is fully open with credentials enabled (unsafe for production).
- API creates DB schema at runtime on app startup.
- Startup path seeds reference data on every process start.
- Frontend auth token is stored in localStorage (higher XSS impact than secure cookies).

## 3. Target Architecture

- Netlify hosts UI from ui.
- Netlify uses environment variable NEXT_PUBLIC_API_BASE pointing to Railway API domain.
- Railway service runs API with environment-specific config.
- Railway Postgres used for production database only.
- Railway Redis used for cache/rate-limit/job coordination.
- S3 bucket stores uploads/derived media with private ACL and signed URLs.

## 4. Release Stages

### Stage 0: Readiness (1-2 days)

- Freeze major feature merges except deployment hardening.
- Confirm production domain names and DNS ownership.
- Create staging and production Railway environments.
- Create staging and production Netlify contexts.

Exit criteria:
- Team agrees on release owner, on-call owner, and rollback owner.

### Stage 1: Security Hardening (2-3 days)

- Replace wildcard CORS with explicit allowed origins list.
- Remove runtime Base.metadata.create_all from startup path.
- Move seed logic to explicit idempotent admin command, not startup.
- Add strict secret management via Railway and Netlify env vars.
- Use short-lived AWS IAM credentials with least-privilege S3 policy.
- Add S3 bucket policy: deny public ACLs, enforce TLS, block public access.
- Add request size limits, rate limiting (Redis-backed), and basic abuse protection.
- Add security headers at edge/API where applicable.

Exit criteria:
- Security checklist passed.
- No critical or high findings in dependency scan.

### Stage 2: CI/CD Baseline (1-2 days)

- Add GitHub Actions workflow:
  - UI lint/build in ui
  - Backend tests/lint
  - Optional migration check using ephemeral Postgres
- Add branch protection:
  - Required status checks
  - Require PR review
  - Disallow direct push to main
- Add deployment jobs:
  - Netlify deploy from main after checks pass
  - Railway deploy from main after checks pass
- Add migration step in deploy pipeline before API promotion.

Exit criteria:
- A PR cannot merge if checks fail.
- Main push auto-deploys both services with logs.

### Stage 3: Data and Migration Safety (1-2 days)

- Ensure Alembic uses DATABASE_URL from environment in all envs.
- Add pre-deploy DB backup for production.
- Add migration smoke test in staging before production deploy.
- Document rollback procedure for both schema and app revision.

Exit criteria:
- Migration rehearsed in staging from snapshot.
- Rollback drill executed once.

### Stage 4: Observability and Reliability (1-2 days)

- Add structured logging with request IDs.
- Add service metrics and error monitoring.
- Add uptime checks for API health endpoint.
- Add alerting thresholds: error rate, p95 latency, instance restarts, DB saturation.
- Add readiness/liveness probe behavior for API start lifecycle.

Exit criteria:
- Alerts verified and routed to owner.
- Dashboards cover core golden signals.

### Stage 5: Usability and Product Quality Gates (1-2 days)

- Define and test top journeys:
  - Signup/signin
  - Contributor submission
  - Transcription validation flow
- Measure and budget performance:
  - Core Web Vitals for UI
  - API p95 latency targets
- Add graceful error states and retry UX for network failures.
- Verify accessibility baseline (keyboard navigation, contrast, form labels).

Exit criteria:
- Journey tests pass in staging.
- Performance and accessibility gates pass.

### Stage 6: Go-Live and Hypercare (2-3 days)

- Deploy to production in low-traffic window.
- Run smoke tests immediately after deployment.
- Monitor for 48-72 hours with rollback threshold criteria.
- Hold post-launch review and capture follow-up actions.

Exit criteria:
- No Sev-1/Sev-2 incidents in hypercare window.

## 5. Production Environment Variables

Backend (Railway):
- APP_ENV=production
- DATABASE_URL
- REDIS_URL
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME
- CORS_ALLOWED_ORIGINS (comma-separated explicit domains)
- LOG_LEVEL

Frontend (Netlify):
- NEXT_PUBLIC_API_BASE

## 6. Security Controls Checklist

- Secrets only in platform secret managers.
- TLS enforced end-to-end.
- Explicit CORS allowlist only.
- DB and Redis not publicly exposed.
- S3 bucket public access blocked.
- Signed URLs for object access and upload.
- Dependency scanning enabled in CI.
- Audit trail for deploy events.

## 7. Usability Controls Checklist

- Critical user journeys documented and tested.
- Friendly empty/loading/error states on all async UI screens.
- Session expiry behavior is predictable and user-friendly.
- Mobile breakpoints validated for high-traffic pages.
- Accessibility checks integrated in release sign-off.

## 8. Ownership Model

- Release owner: coordinates schedule and go/no-go.
- Security owner: validates controls and signs off Stage 1.
- Platform owner: manages Railway/Netlify/S3 configuration.
- QA owner: validates journey tests and usability criteria.
- On-call owner: monitors and responds during hypercare.

## 9. Immediate Next Actions

1. Remove startup schema creation and startup seeding from API app lifecycle.
2. Lock CORS to explicit Netlify domains for staging and production.
3. Add CI workflow with blocking checks and branch protection.
4. Add Railway deploy job and migration step.
5. Add Netlify production deploy job for ui.
6. Create staging environment and run first full dry-run.
