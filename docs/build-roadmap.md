# Build Roadmap (Project Control Center)

## Source of Truth and Baseline
This roadmap is the project control center for delivery sequencing and merge-readiness.

Baseline reviewed state: [Current-State Code Review & Gap Analysis (2026-04-29)](./current-state-code-review.md).

## Current Phase
**Stabilization + sequencing for Manager/Admin Phase 3 expansion.**

Interpretation as of **April 29, 2026**:
- Core backend/API workflows are implemented and validated.
- Employee mobile workflow is implemented and validated.
- Manager/Admin Phases 1 and 2 are implemented.
- Manager/Admin **Phase 3A archive-confirmation slice is implemented**.
- The next work should be bounded Manager/Admin phase slices (3B/3C/3D) without entering deferred domains.

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

## Deferred Scope (Must Stay Deferred)
The following are intentionally deferred and must not be partially introduced in unrelated PRs:
- Parts purchase/vendor cost tracking
- Advanced inventory workflows
- Parts compatibility recommendation engine
- AI/scoring-based part recommendations

## Active Stabilization Concerns
From the reviewed baseline:
1. **React Router v7 future-flag cleanup** remains an open hygiene item (warning-level, not a confirmed blocker).
2. **Main-branch verifiability metadata** should continue to include explicit merge-base/SHA notes when main checkout is constrained.

## Pre-Phase-3A/Immediate Hygiene Item
Before broadening Manager/Admin Phase 3 work, complete one explicit hygiene action:
- **React Router future-flag cleanup** (or equivalent migration plan) to reduce warning noise and future upgrade friction.

> Note: Phase 3A feature slice is already implemented; this hygiene item should be treated as pre-3B gate work or first sub-task in the next phase ticket.

## Recommended Feature Order
1. Router/test hygiene cleanup (future flags and warning noise reduction).
2. Manager/Admin Phase 3B (bounded UX consistency improvements on existing APIs).
3. Manager/Admin Phase 3C (bounded workflow refinements on existing APIs).
4. Manager/Admin Phase 3D (bounded completion polish + regression hardening).
5. Re-assess deferred-domain entry only through explicit scope approval.

## Planned Sequence: Manager/Admin Phase 3A → 3D
### Phase 3A (Completed)
- Archive confirmation UX slice for manager/admin job ticket detail.
- No API/auth/schema changes required.

### Phase 3B (Next)
- Normalize manager/admin feedback patterns (status/archive/approval/error states) across existing screens.
- Keep endpoint usage unchanged.
- No migrations.

### Phase 3C (Completed)
- Completed reports polish/export workflow for manager/admin operations.
- Added/refined report filters, export-friendly table rendering, and client-side CSV export from loaded report data.
- Added explicit labor snapshot/fallback labeling in reports UI; role boundaries and routing model unchanged.
- No new business domain introduction.

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

## Readiness to Start Manager/Admin Phase 3A Workstream
Concise readiness statement:
- The system is stable for continued Manager/Admin Phase 3 execution.
- Phase 3A slice is complete.
- Proceed next with router future-flag hygiene, then Phase 3B bounded work.
- Continue to enforce no-migration/no-deferred-domain constraints for Phase 3B/3C/3D tickets unless separately approved.

## Cross-Linking
- Baseline review: [docs/current-state-code-review.md](./current-state-code-review.md)
- Scope contract: [docs/project-scope.md](./project-scope.md)
- API contract: [docs/api-contract.md](./api-contract.md)
- Setup/validation commands: [docs/development-setup.md](./development-setup.md)
- Top-level orientation: [README.md](../README.md)

- Phase 3B complete in this PR: end-to-end Manager/Admin master-data workflows and validations with test coverage updates.
