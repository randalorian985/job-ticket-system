# Build Roadmap (Project Control Center)

## Source of Truth and Baseline
This roadmap is the project control center for delivery sequencing and merge-readiness.

Baseline reviewed state: [Project Pickup Review and Roadmap Checkpoint (2026-05-06)](./project-pickup-review.md).

## Current Phase
**Stabilization checkpoint before Manager/Admin Phase 3D.**

Interpretation as of **May 6, 2026**:
- Core backend/API workflows are implemented and validated.
- Employee mobile workflow is implemented and validated.
- Manager/Admin Phases 1 and 2 are implemented.
- Manager/Admin **Phase 3A archive-confirmation slice is implemented**.
- Manager/Admin **Phase 3B master-data lifecycle coverage is implemented**.
- Manager/Admin **Phase 3C reports polish/export is implemented in the local snapshot and frontend-validated** during the fresh 2026-05-06 stabilization pickup audit.
- The next work should remain stabilization/verification first, then bounded Manager/Admin Phase 3D without entering deferred domains.

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
- Manager/Admin Phase 3C reports filters, tables, labor snapshot labeling, and client-side CSV export in the local snapshot.

## Deferred Scope (Must Stay Deferred)
The following are intentionally deferred and must not be partially introduced in unrelated PRs:
- Parts purchase/vendor cost tracking
- Advanced inventory workflows
- Parts compatibility recommendation engine
- AI/scoring-based part recommendations

## Active Stabilization Concerns
From the reviewed baseline:
1. **Setup-script gap:** `scripts/setup-codex.sh` is absent from the current local workspace, so the validated setup path from `chore/verify-codex-setup-validation` could not be rerun here.
2. **Remote provenance gap:** the 2026-05-06 pickup audits could not fetch remote refs because GitHub returned HTTP 403.
3. **Backend validation gap:** the review container did not have the .NET SDK, so backend restore/build/test could not run.
4. **npm environment warning:** npm emits `Unknown env config "http-proxy"`; it is warning-level when frontend commands still pass.

## Immediate Hygiene Item
Before broadening Manager/Admin work, complete one explicit stabilization action:
- Re-run the pickup audit from a workspace that contains the validated `scripts/setup-codex.sh`, fetchable remote provenance, and .NET 8 installed, then run the full standard validation sequence.

## Recommended Feature Order
1. Stabilization/verification pass that successfully runs the validated setup script and backend/frontend validation for the implemented Phase 3C local snapshot.
2. Manager/Admin Phase 3D (bounded completion polish + regression hardening).
3. Re-assess deferred-domain entry only through explicit scope approval.

## Planned Sequence: Manager/Admin Phase 3A → 3D
### Phase 3A (Completed)
- Archive confirmation UX slice for manager/admin job ticket detail.
- No API/auth/schema changes required.

### Phase 3B (Completed)
- Delivered end-to-end manager/admin master-data lifecycle coverage across existing APIs for list/detail/create/update/archive/unarchive flows.
- Endpoint usage remained within existing contracts; no new API groups introduced.
- No migrations were added.

### Phase 3C (Implemented locally; frontend-validated, backend/provenance pending)
- Reports polish/export workflow is present for manager/admin operations in the checked-out local snapshot.
- Added/refined report filters, export-friendly table rendering, and client-side CSV export from loaded report data.
- Added explicit labor snapshot/fallback labeling in reports UI; role boundaries and routing model unchanged.
- No new business domain introduction.
- Because the 2026-05-06 audits could not fetch remote refs, run the validated setup script, or run backend validation, treat this as implemented and frontend-validated locally but not fully provenance/backend validated until a pass succeeds with the validated setup script, working GitHub access, and .NET SDK access.

### Phase 3D
- Final pass for manager/admin regression hardening, test additions around existing behavior, and documentation alignment.
- Confirm stable handoff package before any deferred-domain proposal.

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
- Phase 3C appears implemented locally, but latest-main provenance and full backend validation are pending.
- Proceed next with latest-main verification, then Phase 3D bounded hardening only after validation is green.
- Continue to enforce no-migration/no-deferred-domain constraints unless separately approved.

## Cross-Linking
- Baseline review: [docs/project-pickup-review.md](./project-pickup-review.md)
- Scope contract: [docs/project-scope.md](./project-scope.md)
- API contract: [docs/api-contract.md](./api-contract.md)
- Setup/validation commands: [docs/development-setup.md](./development-setup.md)
- Top-level orientation: [README.md](../README.md)

