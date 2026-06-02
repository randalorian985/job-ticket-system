# Historical Bug Regression Audit

Date: 2026-05-28 (UTC)

## Post-Reports Checkpoint Status
This checkpoint re-audits the known historical bug list after the Manager/Admin reports and time-review polish work merged on `main`.

Scope:
- stabilization and documentation only;
- no runtime behavior changes;
- no schema changes or migrations;
- no auth weakening;
- no enum renumbering;
- no new purchasing, inventory, compatibility recommendation, AI/scoring, or ERP-style expansion.

Current evidence from latest `main`:
- `backend/tests/Infrastructure.Tests/HealthIntegrationTests.cs` still verifies unauthenticated `/health` JSON with `status`, `totalDuration`, and `entries`, plus unauthenticated `/api/system/info` metadata.
- `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs` still covers invalid login, malformed password hashes failing closed, inactive-user login rejection, token revalidation for inactive users, employee assignment boundaries, employee archive denial, file upload assignment enforcement, deterministic `201 Created` upload responses, and safe non-leaking file `Location` headers.
- `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs` still covers Manager/Admin report access, employee report denial, Manager/Admin time-entry approval/rejection access, Manager/Admin master-data role boundaries, controlled Admin user invalid-payload `400 Bad Request` responses, Admin-only user management behavior, and employee job-part approval protection.
- `backend/tests/Infrastructure.Tests/ReportingServiceTests.cs` still covers approved-only invoice labor and parts, snapshot-first labor totals, legacy fallback for null snapshots, invoice-status exclusions, and export-oriented lifecycle date fields.
- `frontend/src/routes/__tests__/AppRouter.auth.test.tsx` still covers unauthenticated redirects, employee workflow routing, employee denial from `/manage` and `/manage/reports`, Manager/Admin routing to the manager shell, Manager denial from `/manage/users`, Manager/Admin denial from employee-only routes, and Admin access to `/manage/users`.
- `README.md`, `docs/project-scope.md`, `docs/api-contract.md`, and `docs/build-roadmap.md` now consistently describe the job-ticket-first product boundary, the implemented reports/time-review and closeout/readiness baseline, the current Job Ticket Dispatch & Assignment Readiness Polish lane, and the protected deferred-domain boundaries.

Environment and validation evidence:
- This scheduled workspace could not clone the public GitHub repository because the outbound GitHub tunnel returned HTTP 403.
- The checkpoint therefore records remote file inspection evidence through the GitHub connector rather than local file-system inspection.
- GitHub Actions validation passed for PR head commit `2ed015f9e7d78559c9c1239b9b945dba40769f7f` on May 28, 2026.
- The passing `Validate` workflow included backend restore, backend build, backend test, frontend dependency install, frontend build, and frontend test steps.

## Status Matrix (Post-Reports Checkpoint)

| Group | Current status | Notes |
|---|---|---|
| A. File/photo uploads | Protected by tests | Deterministic `201 Created`, safe relative `Location`, and storage-key redaction remain covered in `AuthIntegrationTests`. |
| B. Time tracking | Protected by tests | Employee assignment boundaries and Manager/Admin approval/rejection paths remain covered. |
| C. Job parts | Protected by tests | Employee approval bypass protection remains covered by integration tests. |
| D. Frontend enum/display | No new regression found in docs review | No enum renumbering or display-contract change was introduced by this checkpoint. |
| E. Auth/routing | Protected by tests | `/manage`, `/manage/reports`, `/manage/users`, employee-only routes, root redirects, and unknown-route behavior remain covered in router tests. |
| F. Environment/dependencies | Validation passed in CI | GitHub Actions validation passed backend restore/build/test and frontend install/build/test for the checkpoint PR. |
| G. Health endpoint | Protected by tests | `/health` remains documented as public and covered by `HealthIntegrationTests`. |
| H. Password/auth hardening | Protected by tests | Malformed hash, inactive login rejection, and inactive-token revalidation remain covered. |
| I. Reporting/labor | Protected by tests | Snapshot-first labor calculations, approved-only totals, and lifecycle date fields remain covered after reports/time-review polish. |
| J. Master data archive/unarchive | No new regression found in docs review | The docs still preserve soft-delete/archive requirements and no checkpoint changes alter master-data behavior. |
| K. Manager/Admin UI | Protected by tests | Route boundaries and Admin-only user access remain covered; reports/time-review baseline remains documented. |
| L. Deferred scope | Open-deferred | New inventory expansion, truck inventory, replenishment, compatibility recommendations, and AI/scoring remain not approved. |
| M. Documentation discipline | Updated after this checkpoint | Core docs are aligned around the completed audit checkpoint, implemented closeout/readiness baseline, current dispatch-readiness lane, and protected deferred-domain boundaries. |

## Follow-Up Needed
1. Job Ticket Closeout & Invoice-Readiness Workflow Polish has since been implemented and validated as part of the Manager/Admin job review baseline.
2. The current job-ticket-first lane is Job Ticket Dispatch & Assignment Readiness Polish. Continue evaluating the next dispatch/assignment readiness gap from the latest `main` branch, and keep any follow-up PR limited to that lane or a clearly necessary stabilization fix.
3. Do not start purchasing expansion, inventory expansion, compatibility recommendations, AI/scoring, accounting, invoice generation, or payment tracking unless the scope docs and roadmap explicitly approve that phase.

## Validation Commands Covered By GitHub Actions

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

## Migration Changes
- None.

---

Date: 2026-05-06 (UTC)

## Scope and Method
This pass re-audited the full known historical bug set (A-M) using:
- Existing audit/review docs in `/docs`
- Backend and frontend implementation files
- Backend and frontend automated test suites

Constraints followed:
- Stabilization/review only; no new feature domains.
- Deferred domains remained deferred.
- No backend enum numeric changes.
- No migrations added.

Environment constraints:
- The 2026-05-06 scope-code-review audit started from local branch `work` at `c2c6d0959b913e25a2b9938daf771fe1bb427924`; local `origin/main` matched that SHA.
- `origin` points to the GitHub repository URL, but `git fetch origin` failed with HTTP 403, so latest remote `origin/main` freshness could not be verified.
- .NET 8 SDK, Node `v20.19.6`, and npm `11.4.2` were available for the scope-code-review validation pass.
- npm emitted a non-blocking `Unknown env config "http-proxy"` warning.

## Status Matrix (A-M)

| Group | Current status | Notes |
|---|---|---|
| A. File/photo uploads | Fixed | Safe deterministic `201 Created` + non-leaking Location and access enforcement remain in place with tests; file DTOs also omit storage provider keys. |
| B. Time tracking | Fixed | Service-layer manager/admin adjustment enforcement + single-open-entry and approval rules verified by code/tests. |
| C. Job parts | Fixed | Employee approval bypass remains blocked; snapshot and approval/invoiced guardrails remain covered; assigned-employee job-part responses omit cost/sale snapshots while Manager/Admin responses retain them. |
| D. Frontend enum/display | Fixed | Explicit numeric maps and unknown fallbacks remain in use; approval labels now match backend values (`1=Pending`, `2=Approved`, `3=Rejected`, `4=Invoiced`) and work-note submissions use `WorkEntryType.Note = 1`. |
| E. Auth/routing | Fixed | Employee/Manager/Admin route boundaries and logout behavior remain protected by router tests. |
| F. Environment/dependencies | Fixed | Node guidance remains aligned with frontend manifests; tooling built/tests successfully in this environment. |
| G. Health endpoint | Fixed | `/health` remains unauthenticated and returns documented JSON contract including `status`, `totalDuration`, `entries`. |
| H. Password/auth hardening | Fixed | Malformed hash fail-closed, inactive-user rejection, and token revalidation protections remain covered. |
| I. Reporting/labor | Fixed | Snapshot-first reporting behavior remains intact with documented legacy fallback coverage. |
| J. Master data archive/unarchive | Fixed | Soft-delete restore dependency validation remains enforced for equipment/parts relationships. |
| K. Manager/Admin UI | Fixed | Manager/Admin shell and route protections remain intact; admin-only sections remain protected; invalid Admin user create/update/reset-password payloads now return controlled `400 Bad Request` responses. |
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
- Backend restore/build/test passed in the 2026-05-06 scope-code-review validation pass.
- Frontend install/build/test passed in the 2026-05-06 scope-code-review validation pass.
- npm emitted a non-blocking `Unknown env config "http-proxy"` warning.
- Remote provenance verification was blocked because `git fetch origin` returned GitHub HTTP 403.

## Action Taken
- Stabilization update: employee job-part response pricing redaction, work-entry enum validation, frontend approval/work-note enum alignment, and file DTO storage-key redaction.
- Documentation synchronization update for the scope-code-review checkpoint.
- Corrected reports invoice-status labels/filter values to match backend enum numeric values.
- Hardened Admin user payload validation so invalid create/update/reset-password payloads return controlled `400 Bad Request` responses.

## Follow-Up Needed
1. Re-run this same audit in an environment where `origin/main` is fetchable, to attach explicit latest-main provenance.
2. Clean npm shell/env warning source for `http-proxy` so CI/dev output is quieter.

## Migration Changes
- None.
