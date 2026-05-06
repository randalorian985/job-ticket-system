# Build Roadmap (Project Control Center)

## Source of Truth and Baseline
This roadmap is the project control center for delivery sequencing and merge-readiness.

Baseline reviewed state: [Scope Code Review and Stabilization Audit (2026-05-06)](./scope-code-review.md).

## Current Phase
**Manager/Admin Phase 3D implemented; stabilization/merge validation checkpoint.**

Interpretation as of **May 6, 2026**:
- Core backend/API workflows are implemented and validated.
- Employee mobile workflow is implemented and validated.
- Manager/Admin Phases 1 and 2 are implemented.
- Manager/Admin **Phase 3A archive-confirmation slice is implemented**.
- Manager/Admin **Phase 3B master-data lifecycle coverage is implemented**.
- Manager/Admin **Phase 3C reports polish/export is implemented** with a polished Manager/Admin reports hub, supported filters, export-friendly tables, and client-side CSV export.
- Manager/Admin **Phase 3D user-management polish and UX hardening is implemented** with safer Admin create/edit/deactivate/reset-password flows, clearer states, role-change confirmation, and regression tests.
- The 2026-05-06 scope-code-review checkpoint fixed two small regressions: frontend report invoice-status labels/filters now match backend enum values, and Admin user invalid payloads now return controlled `400 Bad Request` responses.
- The next work should remain stabilization/verification first before any deferred-domain proposal.

## Completed Scope
### Foundation and architecture
- Clean architecture layering in backend (`Domain`, `Application`, `Infrastructure`, `Api`).
- API-first implementation with policy-based authorization.
- Health endpoint contract retained at `GET /health`.

### Implemented capability surface
- Auth + role enforcement (`Admin`, `Manager`, `Employee`) and active-user token revalidation.
- Master data CRUD/archive surface (customers, service locations, equipment, vendors, part categories, parts).
- Job ticket lifecycle + assignments + work entries.
- Time tracking workflow with approval/rejection/adjustment and audit support.
- Job parts workflow with approval/rejection/archive behavior.
- Job ticket file upload/list/download/archive workflows.
- Reporting foundation endpoints (invoice-ready summaries, cost/labor/parts rollups, service history).

### Frontend delivered
- Employee routes and workflows (`/login`, `/jobs`, `/jobs/:jobTicketId`).
- Manager/Admin shell and operational routes (`/manage` + section routes), including admin-only users route.
- Manager/Admin Phase 3A archive confirmation UX slice.
- Manager/Admin Phase 3B master-data lifecycle screens.
- Manager/Admin Phase 3C reports filters, tables, labor snapshot labeling, and client-side CSV export.
- Manager/Admin Phase 3D Admin user-management polish, role-aware UX hardening, and regression coverage.

## Deferred Scope (Must Stay Deferred)
The following are intentionally deferred and must not be partially introduced in unrelated PRs:
- Parts purchase/vendor cost tracking
- Advanced inventory workflows
- Parts compatibility recommendation engine
- AI/scoring-based part recommendations

## Active Stabilization Concerns
From the reviewed baseline:
1. **Remote provenance transport warning:** direct `git fetch`/`git ls-remote` still return GitHub HTTP 403 from this workspace, but the 2026-05-06 remote-provenance validation confirmed GitHub REST `main` metadata matches local `HEAD` at `fc140b512320575233b53ba8382f4485a47a9689`.
2. **npm environment warning:** npm emits `Unknown env config "http-proxy"`; it is warning-level because frontend install/build/test still pass.
3. **React Router future-flag warnings:** frontend tests pass, while React Router v7 future-flag warnings remain visible and non-blocking.

## Immediate Hygiene Item
Before broadening Manager/Admin work, keep stabilization changes narrow and preserve the validated Phase 3C/3D snapshot. The 2026-05-06 remote-provenance merge-readiness pass is documented in [Remote Provenance Merge-Readiness Validation](./remote-provenance-merge-readiness.md).

## Recommended Feature Order
1. Keep the Phase 3C/3D snapshot merge-ready on the validated baseline, with remote freshness confirmed by GitHub REST metadata when git smart-HTTP remains blocked.
2. Re-assess deferred-domain entry only through explicit scope approval after standard validation remains green on the target merge baseline.

## Planned Sequence: Manager/Admin Phase 3A → 3D
### Phase 3A (Completed)
- Archive confirmation UX slice for manager/admin job ticket detail.
- No API/auth/schema changes required.

### Phase 3B (Completed)
- Delivered end-to-end manager/admin master-data lifecycle coverage across existing APIs for list/detail/create/update/archive/unarchive flows.
- Endpoint usage remained within existing contracts; no new API groups introduced.
- No migrations were added.

### Phase 3C (Implemented)
- Reports polish/export workflow is present for Manager/Admin operations.
- Added a reports hub for invoice-ready summary, job cost summary, jobs ready to invoice, labor by job, labor by employee, parts by job, customer service history, and equipment service history.
- Added supported report filters, export-friendly table rendering, loading/empty/error states, existing-route drill-in links, and client-side CSV export from loaded report data.
- Added explicit labor snapshot/fallback labeling in reports UI; role boundaries and routing model unchanged.
- No backend reporting rule changes, migrations, or new business domain introduction.

### Phase 3D (Implemented)
- Polished the Admin-only user-management page with table layout, create/edit flows, active/inactive role display, loading/empty/success/error states, and validation messaging.
- Added confirmation gates for deactivation, password reset, and role changes that affect access immediately.
- Kept `/manage/users` Admin-only and preserved Manager/Admin vs Employee route boundaries.
- Added focused frontend regression coverage for Admin user-management and route authorization behavior.
- No backend contract changes, migrations, or deferred-domain behavior were added.

## Validation Requirements Before Merge
Run these standard checks from repo root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

Merge-readiness requires:
- Backend build green
- Frontend build green
- Backend/frontend tests green (or explicitly documented environment limitation)
- `/health` endpoint contract retained
- No unauthorized scope expansion into deferred domains

## Readiness for Remaining Manager/Admin Phase 3 Workstream
Concise readiness statement:
- The local snapshot is ready for a stabilization/verification checkpoint, not new feature expansion.
- Phase 3A and 3B slices are complete.
- Phase 3C is implemented; latest remote fetch may still need environment/auth verification when GitHub access is available.
- Proceed next with a narrow stabilization/observability cleanup only after Phase 3D validation remains green on the target merge baseline.
- Continue to enforce no-migration/no-deferred-domain constraints unless separately approved.

## Cross-Linking
- Latest scope review: [docs/scope-code-review.md](./scope-code-review.md)
- Prior baseline review: [docs/project-pickup-review.md](./project-pickup-review.md)
- Scope contract: [docs/project-scope.md](./project-scope.md)
- API contract: [docs/api-contract.md](./api-contract.md)
- Setup/validation commands: [docs/development-setup.md](./development-setup.md)
- Top-level orientation: [README.md](../README.md)

