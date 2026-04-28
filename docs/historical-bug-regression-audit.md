# Historical Bug Regression Audit

Date: 2026-04-28 (UTC)

## Scope and Method
This audit reviewed historical bug/stabilization findings across backend APIs, service-layer authorization, frontend route behavior, dependency/runtime compatibility, and documentation consistency.

Constraints followed during this audit:
- Regression/stabilization only (no new major features).
- No parts purchase/vendor cost tracking implementation.
- No advanced inventory implementation.
- No compatibility recommendation/AI scoring implementation.
- No backend enum numeric changes.
- No migration additions.

Repository note:
- The local repository does not currently have a local `main` branch or configured `origin` remote in this environment, so this audit was executed from the current branch content snapshot.

## Audit Results Summary

| # | Historical Issue | Current Status | Outcome |
|---|---|---|---|
| 1 | File upload Created response bug | Fixed | Deterministic `201 Created` with API-safe Location path. |
| 2 | File upload safe Location header | Fixed | Assigned employee upload integration test verifies safe Location and `201`. |
| 3 | Time-entry adjustment service-layer authorization | Fixed | `AdjustAsync` enforces manager/admin in service layer and has service test coverage. |
| 4 | Job part approval bypass through generic update | Fixed | Update path blocks employee approval/status mutation; integration test confirms pending remains. |
| 5 | Employee job status/priority enum label bug | Fixed | Explicit numeric maps present; unknown values fallback safely; frontend coverage present. |
| 6 | React Router redirect loop / role routing behavior | Fixed but missing tests | Core role routing works and unauthorized path exists; logout/loop-specific regression tests could be expanded. |
| 7 | Node/test dependency runtime mismatch | Fixed | jsdom/vitest pinned to Node 20.0.0+-compatible versions; docs align. |
| 8 | `/health` API contract mismatch | Fixed but missing tests | JSON contract implemented and tested; tests can further assert `totalDuration` and `entries` explicitly. |
| 9 | Malformed password hash fail-closed behavior | Fixed | Malformed hash login fails closed; integration test present. |
| 10 | Inactive/archived employee login block | Fixed | Login blocked for inactive users and `/api/auth/me` resolves only active users. |
| 11 | Token revalidation for inactive/archived/deleted users | Fixed | Central JWT event revalidates active employee status; integration coverage present. |
| 12 | Labor-rate snapshot reporting | Fixed | Time-entry snapshots captured on clock-in; reporting prefers snapshots with legacy fallback; tests/docs present. |
| 13 | Manager/Admin workload index hardening | Fixed | `AddPreManagerAdminHardening` migration contains focused index set; snapshot/configs are consistent. |
| 14 | Employee-safe part lookup | Fixed | Employee-accessible lookup returns safe subset without cost fields; manager/admin CRUD remains protected. |
| 15 | Manager/Admin route protection | Fixed (partial test gap) | `/manage` manager/admin-only and `/manage/users` admin-only in router; manager denial covered, admin-allow test can be expanded. |
| 16 | Manager/Admin UI deferred domains guardrail | Fixed | Deferred domains remain unimplemented and documented as deferred. |
| 17 | README/docs update discipline | Fixed | README + API contract + project scope broadly aligned with current implemented/deferred state. |

## Detailed Findings by Issue

### 1) File upload Created response bug
- **Current status:** Fixed.
- **Implementation verified:** Upload controller returns `Created(location, created)` with deterministic location format `/api/job-tickets/{jobTicketId}/files/{fileId}`.
- **Files inspected:**
  - `backend/src/Api/Controllers/JobTicketFilesController.cs`
- **Tests found:**
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs` (safe location + `201` behavior).
- **Action taken:** Audit only; no code change required.
- **Follow-up needed:** No.

### 2) File upload safe Location header
- **Current status:** Fixed.
- **Implementation verified:** Assigned employee can upload for assigned job; response includes safe API location without storage path leakage.
- **Files inspected:**
  - `backend/src/Api/Controllers/JobTicketFilesController.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - `Assigned_employee_file_upload_returns_created_with_safe_location_header` integration test.
- **Action taken:** Audit only; no code change required.
- **Follow-up needed:** No.

### 3) Time-entry adjustment service-layer authorization
- **Current status:** Fixed.
- **Implementation verified:** `TimeEntriesService.AdjustAsync` executes `EnsureManagerOrAdmin()` at service layer.
- **Files inspected:**
  - `backend/src/Application/TimeEntries/TimeEntryServices.cs`
  - `backend/tests/Infrastructure.Tests/TimeEntriesServiceTests.cs`
- **Tests found:**
  - `Employee_cannot_adjust_time_entry_through_service_direct_invocation`.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 4) Job part approval bypass through generic update
- **Current status:** Fixed.
- **Implementation verified:**
  - Generic `UpdatePartAsync` enforces manager/admin when `ApprovalStatus` is supplied.
  - Manager override flag is blocked for non-managers.
- **Files inspected:**
  - `backend/src/Application/JobTickets/JobTicketServices.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - `Employee_cannot_change_part_approval_status_through_update_endpoint` (approval remains pending).
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 5) Employee status/priority enum label mapping
- **Current status:** Fixed.
- **Implementation verified:**
  - Explicit numeric maps for status/priority (no positional array assumptions).
  - Unknown values fallback to `Unknown status` / `Unknown priority`.
  - Manager views reuse employee mapping helpers.
- **Files inspected:**
  - `frontend/src/pages/employee/jobDisplay.ts`
  - `frontend/src/pages/manager/managerDisplay.ts`
  - `frontend/src/pages/employee/__tests__/MyJobsPage.test.tsx`
- **Tests found:**
  - My Jobs test checks known mappings + unknown fallback.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 6) React Router redirect loop / role routing behavior
- **Current status:** Fixed but missing tests.
- **Implementation verified:**
  - Home routing sends Employee to `/jobs` and Manager/Admin to `/manage`.
  - Role-protected route wrappers and `/unauthorized` route exist.
  - Employee blocked from `/manage`; manager blocked from admin-only nested route.
- **Files inspected:**
  - `frontend/src/routes/AppRouter.tsx`
  - `frontend/src/components/ProtectedRoute.tsx`
  - `frontend/src/routes/__tests__/AppRouter.auth.test.tsx`
  - `frontend/src/features/auth/AuthContext.tsx`
- **Tests found:**
  - Unauthenticated redirect, employee access, employee denied `/manage`, manager denied `/manage/users`.
- **Gap noted:**
  - No explicit regression test for logout-state clearing redirect behavior and redirect-loop prevention sequence.
- **Action taken:** Documented gap only.
- **Follow-up needed:** Optional small frontend auth routing test expansion.

### 7) Node/test dependency runtime mismatch
- **Current status:** Fixed.
- **Implementation verified:**
  - Frontend declares Node `>=20.0.0`.
  - `jsdom` and `vitest` are pinned in package manifest and lock file.
  - Docs/readme Node requirement matches.
- **Files inspected:**
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `README.md`
  - `docs/development-setup.md`
- **Tests/build validation:** npm install/build/test executed successfully under environment runtime.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 8) `/health` API contract mismatch
- **Current status:** Fixed but missing tests.
- **Implementation verified:**
  - Health endpoint returns JSON payload via custom `ResponseWriter`.
  - Content type is `application/json; charset=utf-8`.
  - Endpoint remains unauthenticated.
  - API contract doc reflects JSON shape with `status`, `totalDuration`, `entries`.
- **Files inspected:**
  - `backend/src/Api/Program.cs`
  - `backend/tests/Infrastructure.Tests/HealthIntegrationTests.cs`
  - `docs/api-contract.md`
- **Tests found:**
  - Health integration test asserts 200 + JSON content type + `status` field.
- **Gap noted:**
  - Test does not currently assert `totalDuration` and `entries` explicitly.
- **Action taken:** Documented small test-gap only.
- **Follow-up needed:** Optional enhancement in health integration test assertions.

### 9) Malformed password hash fail-closed
- **Current status:** Fixed.
- **Implementation verified:**
  - Password verify path catches malformed hash parse exceptions and returns false.
  - Login returns unauthorized, without sensitive details.
- **Files inspected:**
  - `backend/src/Application/Auth/AuthServices.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - `Login_with_malformed_password_hash_returns_unauthorized`.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 10) Inactive/archived employee login block
- **Current status:** Fixed.
- **Implementation verified:**
  - Login checks employee active status.
  - `GetCurrentUserAsync` only returns active employee records.
- **Files inspected:**
  - `backend/src/Application/Auth/AuthServices.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - `Login_fails_for_inactive_user`.
  - Token revalidation + `/api/auth/me` failure test when user becomes inactive.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 11) Token revalidation for inactive/archived/deleted users
- **Current status:** Fixed.
- **Implementation verified:**
  - JWT bearer events wired to `ActiveEmployeeTokenValidationEvents` in `Program.cs`.
  - Event checks active employee status on each token validation.
  - `/health` remains outside auth requirements.
- **Files inspected:**
  - `backend/src/Api/Auth/ApiSecurity.cs`
  - `backend/src/Api/Program.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - `Inactive_user_with_previously_issued_token_is_rejected_for_protected_endpoints_and_me`.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 12) Labor-rate snapshot reporting
- **Current status:** Fixed.
- **Implementation verified:**
  - `TimeEntry` has nullable snapshot fields.
  - Clock-in captures employee cost/bill snapshot values.
  - Reporting calculations prefer snapshots with legacy null fallback.
  - Docs explain snapshot-first behavior and fallback behavior.
- **Files inspected:**
  - `backend/src/Domain/Entities/DomainEntities.cs`
  - `backend/src/Infrastructure/Persistence/Configurations/CoreEntityConfigurations.cs`
  - `backend/src/Infrastructure/Persistence/Migrations/20260428170338_AddPreManagerAdminHardening.cs`
  - `backend/src/Application/TimeEntries/TimeEntryServices.cs`
  - `backend/src/Application/Reporting/ReportingServices.cs`
  - `backend/tests/Infrastructure.Tests/TimeEntriesServiceTests.cs`
  - `backend/tests/Infrastructure.Tests/ReportingServiceTests.cs`
  - `docs/api-contract.md`
  - `docs/project-scope.md`
- **Tests found:**
  - Clock-in snapshot capture test.
  - Snapshot immutability vs later employee rate changes.
  - Legacy null snapshot fallback test.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 13) Manager/Admin workload index hardening
- **Current status:** Fixed.
- **Implementation verified:**
  - Migration exists (`AddPreManagerAdminHardening`) with focused indexes for workload query patterns.
  - Index definitions align with EF configurations and model snapshot.
- **Files inspected:**
  - `backend/src/Infrastructure/Persistence/Migrations/20260428170338_AddPreManagerAdminHardening.cs`
  - `backend/src/Infrastructure/Persistence/Configurations/CoreEntityConfigurations.cs`
  - `backend/src/Infrastructure/Persistence/Migrations/ApplicationDbContextModelSnapshot.cs`
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 14) Employee-safe part lookup
- **Current status:** Fixed.
- **Implementation verified:**
  - Employee-or-above authorized lookup endpoint exists.
  - Lookup DTO excludes cost fields.
  - Full parts CRUD remains manager/admin policy-restricted.
- **Files inspected:**
  - `backend/src/Api/Controllers/PartLookupController.cs`
  - `backend/src/Api/Controllers/MasterData/PartsController.cs`
  - `backend/tests/Infrastructure.Tests/AuthIntegrationTests.cs`
- **Tests found:**
  - Employee lookup integration test verifies `unitCost` is absent.
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 15) Manager/Admin route protection
- **Current status:** Fixed (partial test gap).
- **Implementation verified:**
  - `/manage` wrapped in Manager/Admin protection.
  - Nested `/manage/users` wrapped with Admin-only protection.
- **Files inspected:**
  - `frontend/src/components/ProtectedRoute.tsx`
  - `frontend/src/routes/AppRouter.tsx`
  - `frontend/src/routes/__tests__/AppRouter.auth.test.tsx`
- **Tests found:**
  - Employee denied manager route.
  - Manager denied admin users route.
- **Gap noted:**
  - Admin-positive test for `/manage/users` route could be added for symmetric coverage.
- **Action taken:** Documented test coverage gap.
- **Follow-up needed:** Optional.

### 16) Deferred Manager/Admin domains remain deferred
- **Current status:** Fixed.
- **Implementation verified:** Deferred domains are clearly marked deferred and not implemented.
- **Files inspected:**
  - `README.md`
  - `docs/project-scope.md`
  - `docs/api-contract.md`
  - Frontend manager routes/pages under `frontend/src/pages/manager` and `frontend/src/routes/AppRouter.tsx`
- **Action taken:** Audit only.
- **Follow-up needed:** No.

### 17) README/docs update discipline
- **Current status:** Fixed.
- **Implementation verified:** README and docs reflect completed phases, route coverage, deferred domains, and API contract details without stale “initial/future groups only” framing.
- **Files inspected:**
  - `README.md`
  - `docs/api-contract.md`
  - `docs/project-scope.md`
  - `docs/full-code-review-gap-analysis.md`
  - `docs/code-review-stabilization.md`
- **Action taken:** Audit only.
- **Follow-up needed:** Continue discipline on future merges.

## Regressions Found and Fixes Applied
- No confirmed implementation regressions were discovered in this audit pass.
- No code-path bugfixes were required.
- Documentation artifact added: this historical audit report.

## Files Changed by This Task
- `docs/historical-bug-regression-audit.md` (new).

## Migration Changes
- No new migrations were added.

## Validation Commands Run
1. `dotnet restore backend/JobTicketSystem.sln`
2. `dotnet build backend/JobTicketSystem.sln`
3. `dotnet test backend/JobTicketSystem.sln`
4. `cd frontend && npm install`
5. `cd frontend && npm run build`
6. `cd frontend && npm test`

## Workflow Stability Confirmation
- Employee mobile workflow remains intact (`/login`, `/jobs`, `/jobs/:jobTicketId`) with role/assignment protections unchanged.
- Manager/Admin route tree remains intact, including admin-only `/manage/users` gate.
- Deferred domains remain unimplemented.

## Recommended Next Step
Create a targeted “audit follow-up tests” task that only adds small missing regression tests (no feature work), prioritizing:
1. `/health` response assertions for `totalDuration` and `entries`.
2. Frontend auth-route regression tests for logout redirect behavior and admin-positive `/manage/users` access.
