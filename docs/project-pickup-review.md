# Project Pickup Review and Roadmap Checkpoint

Review date: **2026-05-06 (UTC)**


## Fresh stabilization pickup audit (2026-05-06)

Branch: `review/stabilization-pickup-audit`

Starting local HEAD: `5c1fa89ddf8aaad42fe863bdfb36fcb9eec709c9`

### Setup-script result

The requested setup-script commands were attempted before this audit:

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

They could not run in this local Codex workspace because `scripts/setup-codex.sh` is not present in the checked-out tree. This appears to be a workspace/provenance gap relative to the validated setup branch baseline (`chore/verify-codex-setup-validation`, commit `c70ebaf66c519328bf3409c7a8689388686e64b5`), which is not available locally and could not be fetched from `origin` in this environment. No replacement setup script was invented during this audit; the next stabilization pass should start from a workspace that contains the validated script or restore that exact validated script before relying on it.

### Remote Git result

A targeted fetch for the validated setup branch was attempted and failed with the same remote-access class of error seen in the prior pickup review:

```text
error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
fatal: expected flush after ref listing
```

Per pickup rules, remote Git access is not gating. This audit continued from the current local Codex workspace. Because the baseline commit is not present locally, this audit cannot prove ancestry to `c70ebaf66c519328bf3409c7a8689388686e64b5` or latest `origin/main`.

### Current phase determination

- Current completed implementation phase in the local snapshot: **Manager/Admin Phase 3C reports polish/export is implemented**. Evidence includes backend report filters for billing party, service location, employee, job status, invoice status, offset, and limit; frontend report query serialization for the same filters; a Manager/Admin reports page with CSV export from loaded rows; and frontend tests covering extended filters/export visibility and labor snapshot/fallback labeling.
- Current active/pickup phase: **stabilization/verification before Manager/Admin Phase 3D**.
- Phase 3D next?: **Yes, but only after stabilization gates are satisfied**. The next feature implementation phase should be Manager/Admin Phase 3D regression hardening; do not start it from a workspace that still lacks the validated setup script, latest-main/validated-baseline provenance, and backend validation.

### Validation results from this fresh audit

- `chmod +x scripts/setup-codex.sh && ./scripts/setup-codex.sh`: blocked because `scripts/setup-codex.sh` is missing from this local workspace.
- `dotnet --info`: blocked because the .NET SDK is not installed (`dotnet: command not found`).
- `dotnet restore backend/JobTicketSystem.sln`: blocked because the .NET SDK is not installed (`dotnet: command not found`).
- `cd frontend && npm install`: passed; npm emitted the existing non-blocking `Unknown env config "http-proxy"` warning.
- `cd frontend && npm run build`: passed; Vite built 59 modules successfully and emitted the existing non-blocking npm `http-proxy` warning.
- `cd frontend && npm test`: passed; 8 test files and 28 tests passed, with the same non-blocking npm warning.

### Remaining gaps and risks

1. The validated setup script is absent from the current local tree, so this audit could not exercise the now-validated setup path.
2. Remote Git fetch returns HTTP 403, so latest remote state and the stated setup-validation commit could not be verified.
3. Backend validation remains blocked by the missing .NET SDK in this container.
4. Frontend validation is green, but npm continues to emit a non-blocking `Unknown env config "http-proxy"` warning.
5. Phase 3D remains the correct next implementation phase, but starting Phase 3D before resolving the setup/provenance/backend-validation gaps would weaken the stabilization chain.

## Branch and Git provenance

- Repository root confirmed at `/workspace/job-ticket-system` by checking `backend/JobTicketSystem.sln`, `frontend/package.json`, `README.md`, and `docs/`.
- Starting branch before work: `work`.
- HEAD before work: `059e851d7d698965e85ea8902a3b0c98e9eb815b`.
- `origin` was repaired to `https://github.com/randalorian985/job-ticket-system.git` before review.
- `origin/main` fetch status: **not fetchable in this environment**.
- Exact Git error from the required fetch/rev-parse sequence:

```text
error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
fatal: expected flush after ref listing
fatal: ambiguous argument 'origin/main': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
origin/main
```

Because `origin/main` was not fetchable, this review did **not** create `review/project-pickup-audit` from `origin/main` before inspection. Remote verification was skipped after the single required fetch attempt, and this checkpoint validates the current clean local Codex workspace only. Do not claim this branch is based on latest `origin/main` until GitHub fetch access is restored.

## Environment snapshot

Required setup commands were run before changes. Results:

- `pwd`: `/workspace/job-ticket-system`
- `ls`: `AGENTS.md`, `README.md`, `backend`, `docker-compose.yml`, `docs`, `frontend`
- Initial `git status --short`: clean
- Initial `git branch --show-current`: `work`
- Initial `git remote -v`: no remote before repair; `origin` present after repair
- `dotnet --info`: failed because `dotnet` is not installed in this container
- `dotnet --list-sdks`: failed because `dotnet` is not installed in this container
- `node --version`: `v20.19.6`
- `npm --version`: `11.4.2` with a non-blocking `Unknown env config "http-proxy"` warning

## Review scope completed

This review covered:

1. Repository and branch health.
2. Backend architecture, authorization, archive/unarchive, reporting, file upload/download, time tracking, job parts, auth/token hardening, health contract, migrations/model snapshot indicators, and employee-safe part lookup.
3. Frontend employee workflow, Manager/Admin shell, route guards, master-data lifecycle screens, archive/unarchive UI behavior, reports UI, auth/logout behavior, unauthorized behavior, enum label mapping, API clients, and generated-artifact hygiene.
4. Manager/Admin Phase 3C reports polish/export readiness.
5. Documentation alignment across README, roadmap, API/scope/current-state/historical audit/setup docs.
6. Historical regression audit items listed in `docs/historical-bug-regression-audit.md`.
7. Deferred-domain confirmation.
8. CI/environment workflow checks.

## Completed scope summary

### Backend

- Clean layered architecture remains intact: domain entities/enums stay under `Domain`, DTOs/services under `Application`, EF Core persistence/storage under `Infrastructure`, and controllers/HTTP/auth wiring under `Api`.
- Controllers are generally thin and delegate business behavior to application services.
- API surfaces remain DTO-based.
- Policy-based authorization remains in place for Admin-only, Manager/Admin, Employee-or-above, and assigned-employee-or-manager boundaries.
- `/health` remains unauthenticated and returns the documented JSON health payload shape (`status`, `totalDuration`, `entries`).
- File upload returns deterministic `201 Created` with a safe API-relative Location path and does not expose local storage paths or storage keys.
- File download/list/archive remain behind assigned employee or Manager/Admin authorization.
- Time-entry adjustment, approval, and rejection enforce Manager/Admin rules in the service layer.
- Job part approval/rejection cannot be bypassed by employees through the generic part update path.
- Inactive/archived users are blocked from login, malformed password hashes fail closed, and protected requests revalidate tokens against active employees.
- Labor reports use time-entry cost/bill snapshots first, with documented fallback to employee rates only for legacy null snapshots.
- Equipment and part unarchive dependency validation remains enforced before records are restored.
- Employee-safe part lookup returns only id/part number/name/description and does not expose cost or price fields.
- No backend enum numeric values were changed in this review.
- No migrations were added in this review.

### Frontend

- Employee workflow remains scoped to `/jobs` and `/jobs/:jobTicketId`.
- Manager/Admin workflow remains scoped under `/manage`.
- `/manage/users` remains nested behind an Admin-only guard.
- Home/fallback routing sends Employees to `/jobs` and Manager/Admin users to `/manage`, avoiding the prior manager/admin employee-route trap.
- Unauthorized routes navigate to the access-denied page rather than weakening route guards.
- Status and priority labels use explicit numeric maps/options instead of zero-based enum arrays.
- Manager/Admin master-data lifecycle screens include create/edit/archive/unarchive flows for existing APIs.
- Reports UI for Phase 3C is present in the local snapshot with filters, report buttons/tables, loading-by-action behavior through API calls, error handling, empty/no-export behavior when rows are absent, export-friendly number formatting, and client-side CSV export from loaded rows.
- Frontend report tests cover extended filters/export link rendering and labor snapshot/fallback label text.

## In-progress or pending work

- Remote provenance is pending. `origin/main` could not be fetched because GitHub returned HTTP 403, so stale/superseded remote branch cleanup could not be verified.
- Backend validation is pending in this container because the .NET SDK is missing.
- Manager/Admin Phase 3C appears implemented in the checked-out local snapshot, but this pass cannot classify it as fully validated because backend restore/build/test could not run and `origin/main` was unavailable.
- Manager/Admin Phase 3D should not begin until a stabilization/verification pass runs with a fetchable `origin/main` and .NET 8 SDK available.
- The repository contains generated `obj/` files in the current workspace view, but they are already ignored by `.gitignore`; no ignored build output was committed by this review.

## Current bugs/gaps

No code-path bugfix was made in this review. Current gaps are documentation/provenance/environment items:

1. `origin/main` remote verification is blocked by GitHub HTTP 403 in this environment.
2. .NET backend restore/build/test cannot run because `dotnet` is missing.
3. npm emits a non-blocking `Unknown env config "http-proxy"` warning during npm commands.
4. Some docs were out of sync about the pickup point: README still said only Manager/Admin phases 1-3A were implemented, while roadmap/report docs already described Phase 3B/3C work.
5. `.gitignore` did not explicitly ignore TypeScript incremental build info files produced by frontend builds.

## Documentation sync findings

- `README.md` needed a high-level current-state update because it still described the project as having Manager/Admin phases 1-3A implemented even though the local code/docs contain Phase 3B and Phase 3C work.
- `docs/build-roadmap.md` needed pickup-point cleanup because it simultaneously marked Phase 3C complete and still recommended proceeding to Phase 3C.
- `docs/historical-bug-regression-audit.md` needed a fresh date/environment update because it referenced an older workspace without an `origin` remote and older validation results.
- `docs/current-state-code-review.md`, `docs/project-scope.md`, `docs/api-contract.md`, and `docs/development-setup.md` were reviewed and did not require broad rewrites for this checkpoint.

## CI/environment findings

- `.github/workflows/dotnet.yml` exists and validates `backend/JobTicketSystem.sln` for restore/build/test.
- Frontend workflow steps use `working-directory: frontend` for install/build/test.
- CI config uses .NET 8 and Node 20, matching backend/global.json and frontend `engines` expectations.
- `.gitignore` already ignores .NET `bin/` and `obj/`, Node `node_modules/`, `dist/`, `build/`, logs, env files, coverage, and test results.
- `.gitignore` was updated to explicitly ignore `frontend/*.tsbuildinfo` and `frontend/tsconfig.*.tsbuildinfo` so generated TypeScript incremental build metadata is not committed.

## Deferred-scope confirmation

The following remain deferred and were not implemented or expanded by this review:

- Parts Purchase / Vendor Cost Tracking
- Advanced Inventory
- Parts Compatibility Recommendation Engine
- AI/scoring-based recommendations

## Phase 3C readiness classification

**Manager/Admin Phase 3C status: Implemented but unreviewed.**

Rationale: the local snapshot includes reports hub/navigation, report filters, report tables, error/empty behavior, CSV export, labor snapshot/fallback labels, tests, and docs. However, this environment could not fetch `origin/main` and could not run backend validation because the .NET SDK is missing. Treat Phase 3C as implemented in the local branch, but not fully validated against latest `origin/main` from this checkpoint.


## Validation results from this pass

- `dotnet restore backend/JobTicketSystem.sln`: blocked by missing .NET SDK (`dotnet: command not found`); environment-related.
- `dotnet build backend/JobTicketSystem.sln`: blocked by missing .NET SDK (`dotnet: command not found`); environment-related.
- `dotnet test backend/JobTicketSystem.sln`: blocked by missing .NET SDK (`dotnet: command not found`); environment-related.
- `cd frontend && npm install`: passed with a non-blocking npm `Unknown env config "http-proxy"` warning.
- `cd frontend && npm run build`: passed with the same non-blocking npm warning.
- `cd frontend && npm test`: passed with 8 test files and 28 tests passing, with the same non-blocking npm warning.

## Recommended next task

Run a stabilization verification task from a fresh branch based on fetchable `origin/main` in an environment with .NET 8 installed:

> Re-run project pickup stabilization from latest `origin/main`, run full backend/frontend validation, verify Phase 3C reports polish/export against the merged baseline, and only then decide whether to proceed to Manager/Admin Phase 3D regression hardening.

## Recommended next PR title

`Verify Phase 3C baseline and prepare Phase 3D stabilization`

## Is Phase 3C next?

No new Phase 3C implementation should be started from this branch. Phase 3C appears already implemented locally. The next correct step is **stabilization/verification first**, then Phase 3D only after latest-main provenance and full validation are green.
