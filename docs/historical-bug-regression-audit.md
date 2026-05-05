# Historical Bug Regression Audit

Date: 2026-05-05 (UTC)

## Scope and Method
This pass re-audited the full known historical bug set (A–M) using:
- Existing audit/review docs in `/docs`
- Backend and frontend implementation files
- Backend and frontend automated test suites

Constraints followed:
- Stabilization/review only; no new feature domains.
- Deferred domains remained deferred.
- No backend enum numeric changes.
- No migrations added.

Environment constraint:
- Local branch `work` was available, but no local `main` or `origin` remote was configured in this execution environment.

## Status Matrix (A–M)

| Group | Current status | Notes |
|---|---|---|
| A. File/photo uploads | Fixed | Safe deterministic `201 Created` + non-leaking Location and access enforcement remain in place with tests. |
| B. Time tracking | Fixed | Service-layer manager/admin adjustment enforcement + single-open-entry and approval rules verified by code/tests. |
| C. Job parts | Fixed | Employee approval bypass remains blocked; snapshot and approval/invoiced guardrails remain covered. |
| D. Frontend enum/display | Fixed | Explicit numeric maps and unknown fallbacks remain in use. |
| E. Auth/routing | Fixed | Employee/Manager/Admin route boundaries and logout behavior remain protected by router tests. |
| F. Environment/dependencies | Fixed | Node guidance remains aligned with frontend manifests; tooling built/tests successfully in this environment. |
| G. Health endpoint | Fixed | `/health` remains unauthenticated and returns documented JSON contract including `status`, `totalDuration`, `entries`. |
| H. Password/auth hardening | Fixed | Malformed hash fail-closed, inactive-user rejection, and token revalidation protections remain covered. |
| I. Reporting/labor | Fixed | Snapshot-first reporting behavior remains intact with documented legacy fallback coverage. |
| J. Master data archive/unarchive | Fixed | Soft-delete restore dependency validation remains enforced for equipment/parts relationships. |
| K. Manager/Admin UI | Fixed | Manager/Admin shell and route protections remain intact; admin-only sections remain protected. |
| L. Deferred scope | Open-deferred | Deferred domains still not implemented, by design. |
| M. Documentation discipline | Fixed | Core docs remain aligned after this sync pass. |

## Files Inspected (Representative)
- Backend API/auth/health:  
  `backend/src/Api/Program.cs`, `backend/src/Api/Auth/ApiSecurity.cs`, `backend/src/Api/Controllers/*.cs`
- Backend services/domain/persistence:  
  `backend/src/Application/**`, `backend/src/Domain/**`, `backend/src/Infrastructure/**`
- Backend regression tests:  
  `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`, `HealthIntegrationTests.cs`, `JobTicketFileServicesTests.cs`, `JobTicketPartsServiceTests.cs`, `TimeEntriesServiceTests.cs`, `ReportingServiceTests.cs`, `MasterDataServicesTests.cs`
- Frontend routes/pages/api clients/tests:  
  `frontend/src/routes/AppRouter.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/routes/__tests__/AppRouter.auth.test.tsx`, `frontend/src/pages/employee/**`, `frontend/src/pages/manager/**`, `frontend/src/api/**`
- Documentation set:  
  `README.md`, `docs/project-scope.md`, `docs/api-contract.md`, `docs/development-setup.md`, `docs/build-roadmap.md`, `docs/full-code-review-gap-analysis.md`, `docs/current-state-code-review.md`, `docs/code-review-stabilization.md`

## Tests Found / Run
- Backend test suite: `88 passed`.
- Frontend test suite: `28 passed`.
- Build validations for backend/frontend completed successfully.

## Action Taken
- Documentation synchronization update for this audit/current-state review, including explicit Manager/Admin Phase 3B master-data lifecycle coverage confirmation in roadmap-aligned docs.
- No code-path changes were required based on this regression pass.

## Follow-Up Needed
1. Re-run this same audit in an environment where `origin/main` is available, to attach explicit merge-base/SHA provenance.
2. Clean npm shell/env warning source for `http-proxy` so CI/dev output is quieter.

## Migration Changes
- None.
