# Historical Bug Regression Audit

Date: 2026-06-12 (UTC)

## Post-Manager-Time-Approval And Navigation Refactor Checkpoint
This checkpoint records the scheduled-runner audit after the Manager-first Time Approval workflow and follow-up Manager/Admin display/navigation helper refactors merged on `main` at `4d55744d4f0bf54e54abf5ec4f34a68e28e221e5`.

Scope:
- documentation/audit alignment only;
- no runtime behavior changes;
- no schema changes or migrations;
- no auth weakening;
- no enum renumbering;
- no hard deletes;
- no purchasing expansion, receiving expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

Current evidence from latest `main`:
- Live GitHub connector state showed no open pull requests before this checkpoint PR was prepared.
- The scheduled-runner source bundle bridge on issue #166 reconstructed latest `main` successfully for local read-only inspection.
- `README.md`, `docs/build-roadmap.md`, `docs/project-scope.md`, and `docs/api-contract.md` remained aligned around the protected job-ticket baseline, implemented Employee workflow, Manager/Admin service-ticket workspace, queue-first Time Approval workflow, reporting/export behavior, parts request workflow, purchasing-support baseline, inventory-foundation baseline, and deferred expansion domains.
- `/manage` remains Manager/Admin-only, `/manage/users` remains Admin-only, and `GET /api/users/assignable-employees` remains a narrow Manager/Admin lookup for active, non-archived Employee-role users.
- Technician field-recording paths remain documented as requiring an open time entry for the selected job ticket before Employee work notes, ticket parts, part requests, and file/photo activity.
- Technician-safe part lookup still returns `PartLookupDto` without cost, price, vendor, purchase, inventory, catalog-admin, or billing fields.
- Back-office part request review remains Manager/Admin-only and continues to avoid recommendation, AI/scoring, automatic compatibility, and automatic approval language.
- File/photo upload, health endpoint, malformed password hash, inactive/archived user, token revalidation, Admin user invalid-payload handling, labor-rate snapshot reporting, explicit enum map, and Manager/Admin route regression coverage remains present in the inspected test suite.

Environment and validation evidence:
- Normal GitHub clone/fetch/curl/raw/codeload paths remain unreliable in the scheduled runner, so source inspection used the GitHub connector plus the issue #166 bundle workaround.
- Local backend validation could not run because `dotnet` is not installed in this scheduled runner.
- Local frontend validation was not run for this documentation-only checkpoint because the edit does not affect compiled frontend code and reconstructed workspace dependencies are not installed.
- GitHub Actions on this PR head remains the validation authority before merge.

## Status Matrix (Post-Manager-Time-Approval Checkpoint)

| Group | Current status | Notes |
|---|---|---|
| A. File/photo uploads | Protected by tests | Deterministic `201 Created`, safe relative `Location`, and non-leaking storage behavior remain covered. |
| B. Time tracking | Protected by tests | Queue-first Manager/Admin review, single/bulk approval, rejection, adjustment audit, and service-layer authorization coverage remain present. |
| C. Job parts | Protected by tests | Employee approval bypass protection, technician-safe requests, and Manager/Admin review boundaries remain covered. |
| D. Frontend enum/display | Protected by tests | Manager display helper tests preserve explicit approval, status, and priority label maps. |
| E. Auth/routing | Protected by tests | `/manage`, `/manage/users`, employee routes, and Manager/Admin routing boundaries remain covered. |
| F. Environment/dependencies | CI authority required | Scheduled-runner local validation remains blocked for backend; GitHub Actions must validate PR heads. |
| G. Health endpoint | Protected by tests | `/health` remains documented as public and covered by integration tests. |
| H. Password/auth hardening | Protected by tests | Malformed hash, inactive login rejection, archived user boundaries, and token revalidation coverage remain present. |
| I. Reporting/labor | Protected by tests/docs | Snapshot-first labor totals and existing legacy fallback behavior remain documented and covered. |
| J. Master data archive/unarchive | Protected by tests | Archive/unarchive behavior and relationship validation remain represented in service/test coverage. |
| K. Manager/Admin UI | Protected by recent stabilization | Time Approval queue-first workflow, task navigation, and display helper behavior were recently validated and refactored without intended behavior change. |
| L. Deferred scope | Open-deferred | Purchasing expansion, receiving expansion, inventory expansion, recommendations, AI/scoring, automatic compatibility, and automatic approval remain deferred. |
| M. Documentation discipline | Updated by this checkpoint | This addendum records the latest clean scheduled-runner audit state after connector and bundle access were available. |

Follow-up guidance:
1. Keep the build lane on one active PR at a time.
2. Do not start another feature lane until the source-of-truth docs explicitly approve that lane and daily audit guardrails remain clean.
3. Continue treating GitHub Actions as validation authority while scheduled-runner checkout and local toolchain limitations remain unresolved.

---

Date: 2026-06-10 (UTC)

## Post-Mobile-Navigation Stabilization Checkpoint
This checkpoint records the scheduled-runner audit after PR #255 (`fix manager mobile navigation hide rule`) merged on `main` at `5b39450ac3827f6dfd9426cdc64ca1993c0169f5`.

Scope:
- documentation/audit alignment only;
- no runtime behavior changes;
- no schema changes or migrations;
- no auth weakening;
- no enum renumbering;
- no hard deletes;
- no purchasing expansion, receiving expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

Current evidence from latest `main`:
- Live GitHub state showed no open pull requests after PR #255 merged.
- `README.md`, `docs/build-roadmap.md`, `docs/project-scope.md`, and `docs/api-contract.md` remained aligned around the protected job-ticket baseline, implemented Manager/Admin service-ticket workspace, implemented Phase 3C reporting polish/export workflow, and deferred expansion domains.
- The scheduled-runner source bundle bridge on issue #166 reconstructed latest `main` successfully for local read-only inspection.
- `/manage` remains Manager/Admin-only, `/manage/users` remains Admin-only, and `GET /api/users/assignable-employees` remains a narrow Manager/Admin lookup for active, non-archived Employee-role users.
- Technician-safe part lookup still returns `PartLookupDto` without cost, price, vendor, purchase, inventory, catalog-admin, or billing fields.
- Part request and job-ticket part approval/review paths remain Manager/Admin back-office workflows; technician paths continue to avoid pricing and billing controls.
- File/photo upload, health endpoint, malformed password hash, inactive/archived user, token revalidation, labor-rate snapshot reporting, explicit enum map, and Manager/Admin route regression coverage remains present in the inspected test suite.

Environment and validation evidence:
- Local checkout remains unavailable in the scheduled runner through normal GitHub network paths, so source inspection used the issue #166 bundle workaround.
- Local backend validation could not run because `dotnet` is not installed in this scheduled runner.
- Local frontend validation was not run from the reconstructed bundle because dependencies are not installed in the runner workspace.
- GitHub Actions on any PR created from this checkpoint remains the validation authority before merge.

## Status Matrix (Post-Mobile-Navigation Checkpoint)

| Group | Current status | Notes |
|---|---|---|
| A. File/photo uploads | Protected by tests | Deterministic `201 Created`, safe relative `Location`, and non-leaking storage behavior remain covered. |
| B. Time tracking | Protected by tests | Manager/Admin approval and employee assignment boundaries remain covered. |
| C. Job parts | Protected by tests | Employee approval bypass protection and Manager/Admin review boundaries remain covered. |
| D. Frontend enum/display | No new regression found | No enum numeric-value or label-map drift was found in this checkpoint. |
| E. Auth/routing | Protected by tests | `/manage`, `/manage/users`, employee routes, and Manager/Admin routing boundaries remain covered. |
| F. Environment/dependencies | CI authority required | Scheduled-runner local validation remains blocked; GitHub Actions must validate PR heads. |
| G. Health endpoint | Protected by tests | `/health` remains documented as public and covered by integration tests. |
| H. Password/auth hardening | Protected by tests | Malformed hash, inactive login rejection, archived user boundaries, and token revalidation coverage remain present. |
| I. Reporting/labor | Protected by tests/docs | Snapshot-first labor totals and existing legacy fallback behavior remain documented and covered. |
| J. Master data archive/unarchive | No new regression found | Archive/soft-delete requirements remain documented and represented in service/test coverage. |
| K. Manager/Admin UI | Protected by recent stabilization | Mobile Manager/Admin navigation was hardened by PR #254 and PR #255. |
| L. Deferred scope | Open-deferred | Purchasing expansion, receiving expansion, inventory expansion, recommendations, AI/scoring, automatic compatibility, and automatic approval remain deferred. |
| M. Documentation discipline | Updated by this checkpoint | This addendum records the latest clean scheduled-runner audit state. |

Follow-up guidance:
1. Keep the build lane on one active PR at a time.
2. Do not start another feature lane until the source-of-truth docs explicitly approve that lane and daily audit guardrails remain clean.
3. Continue treating GitHub Actions as validation authority while scheduled-runner checkout and local toolchain limitations remain unresolved.

---

Date: 2026-06-07 (UTC)

## Current Control-Point Addendum
This addendum aligns the historical audit notes with the current `main` control point after Parts Request Workflow Phase 2, shared UI polish stabilization, and stale catalog-part selection guards for both Manager/Admin and Employee in-ticket part forms were merged.

Scope:
- documentation alignment only;
- no runtime behavior changes;
- no schema changes or migrations;
- no auth weakening;
- no enum renumbering;
- no hard deletes;
- no purchasing expansion, receiving expansion, inventory expansion, compatibility recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

Current source-of-truth alignment:
- `README.md`, `docs/build-roadmap.md`, `docs/project-scope.md`, and `docs/api-contract.md` now describe no active feature PR at this checkpoint.
- Existing purchasing support and inventory foundation remain part of the protected baseline, but purchasing expansion, receiving expansion, vendor invoice expansion, landed-cost expansion, warehouse/truck inventory, replenishment, compatibility recommendations, AI/scoring, automatic compatibility decisions, and automatic approval remain deferred until explicitly re-approved.
- Parts Request Workflow Phase 2 remains a job-ticket-first parts request/review workflow, not a purchasing or inventory expansion workflow.
- Manager/Admin and Employee Add / Request Part forms now clear any selected catalog part when the typed search changes, protecting unlisted-part submissions from stale `partId` values.

Follow-up guidance:
1. Do not carry the older Job Ticket Dispatch & Assignment Readiness Polish lane as the current active lane.
2. Keep the next workstream in stabilization, validation, observability, or documentation hygiene unless a new business capability is explicitly approved in the scope docs and roadmap.
3. Continue using this audit as a regression watchlist for known historical bugs, not as approval to expand deferred domains.

---

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
- `README.md`, `docs/project-scope.md`, `docs/api-contract.md`, and `docs/build-roadmap.md` consistently described the job-ticket-first product boundary, the implemented reports/time-review and closeout/readiness baseline, the then-current Job Ticket Dispatch & Assignment Readiness Polish lane, and the protected deferred-domain boundaries.

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
| M. Documentation discipline | Updated after this checkpoint | Core docs were aligned around the completed audit checkpoint, implemented closeout/readiness baseline, then-current dispatch-readiness lane, and protected deferred-domain boundaries. |

## Follow-Up Needed
1. Job Ticket Closeout & Invoice-Readiness Workflow Polish has since been implemented and validated as part of the Manager/Admin job review baseline.
2. The prior Job Ticket Dispatch & Assignment Readiness Polish lane should no longer be treated as current active work. Continue evaluating the latest `main` branch for narrow stabilization, validation, observability, or documentation hygiene unless a new business capability is explicitly approved.
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
