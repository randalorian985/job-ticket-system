# Historical Bug Regression Audit

Date: 2026-05-06 (UTC)

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

Environment constraints:
- Local branch `work` was available and initially clean for the first pass; the fresh pickup audit ran on `review/stabilization-pickup-audit` from local HEAD `5c1fa89ddf8aaad42fe863bdfb36fcb9eec709c9`.
- `origin` points to the GitHub repository URL, but remote fetch attempts failed with HTTP 403, so `origin/main` and setup-validation commit `c70ebaf66c519328bf3409c7a8689388686e64b5` could not be verified.
- `scripts/setup-codex.sh` is absent from the current local workspace, so the validated setup-script path could not be rerun during the fresh pickup audit.
- The .NET SDK was not installed in this container, so backend restore/build/test could not run during this pass.
- Frontend validation ran with Node `v20.19.6` and npm `11.4.2`; npm emitted a non-blocking `Unknown env config "http-proxy"` warning.

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
- Setup script: blocked because `scripts/setup-codex.sh` is missing from the current local workspace.
- Backend restore/build/test: blocked in this pass because `dotnet` was not installed.
- Frontend install/build/test: passed in the fresh pickup audit; see the project pickup review and PR validation notes for exact command outcomes.
- Historical bug statuses below were verified by current code inspection and available frontend tests; backend runtime validation must be rerun in an environment with .NET 8 installed.

## Action Taken
- Documentation synchronization update for this audit and the project pickup review, including explicit Manager/Admin Phase 3C implemented-but-needing-validation status.
- No code-path changes were required based on this regression pass.

## Follow-Up Needed
1. Restore or start from a checkout containing the validated `scripts/setup-codex.sh`, then rerun that setup script.
2. Re-run this same audit in an environment where `origin/main` and the setup-validation baseline commit are fetchable, to attach explicit merge-base/SHA provenance.
3. Re-run backend restore/build/test in an environment with .NET 8 installed.
4. Clean npm shell/env warning source for `http-proxy` so CI/dev output is quieter.

## Migration Changes
- None.
