# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/development-setup.md](./development-setup.md)
- [docs/historical-bug-regression-audit.md](./historical-bug-regression-audit.md)

## Current Roadmap Checkpoint
The project has been explicitly re-centered on the original job-ticket system scope.

There is no approved inventory-expansion lane on `main` at this time.

Supporting purchasing and inventory work already merged on `main` remains part of the implemented baseline, but it should not drive the next roadmap phase unless the scope is deliberately expanded again later.

## Product Boundary We Are Protecting
Keep the platform focused on:
- job ticket creation and editing;
- mechanic assignment workflows;
- job information capture and status flow;
- parts added and tracked on tickets;
- time tracking and related reporting;
- Manager/Admin workflows that directly support the above.

Do not steer the project toward a general ERP build-out.

## Implemented Baseline That Remains On Main
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin Phases 1-3D.
- Phase 4A pilot readiness.
- Phase 4B pilot workflow polish.
- Manager/Admin job-ticket create/edit/detail support for scheduling, billing context, purchase-order references, operational notes, assignment/dispatch review cues, and status/archive review clarity.
- Manager/Admin reports and time-review polish, including loaded-row filters, export-friendly tables, client-side CSV export from visible loaded data, and snapshot-first labor labels.
- Parts Purchase / Vendor Cost Tracking Phase 1.
- Parts Purchase / Vendor Cost Tracking Phase 2.
- Purchasing stabilization follow-ups for submit-state discipline, close-transition discipline, and closed-order receiving-action gating.
- Supporting inventory foundation for stock locations, inventory history, stock visibility, manual adjustments, and purchase-order receipt posting.

## Current Roadmap Gate
No later implementation lane is approved yet beyond the merged Manager/Admin reports and time-review polish slice.

Before selecting another implementation lane, complete exactly one bounded post-reports historical regression audit and docs checkpoint.

### Planned scope for the next checkpoint
- re-audit the known historical bug list against the current `main` baseline;
- verify auth, `/health`, employee workflow, Manager/Admin route boundaries, `/manage/users` Admin-only access, and reports/time-review baseline behavior;
- confirm `README.md`, `docs/project-scope.md`, `docs/api-contract.md`, and `docs/historical-bug-regression-audit.md` still match the implemented state;
- keep the work stabilization/docs-focused unless a narrow regression fix is clearly required.

### Scope that remains protected after this checkpoint
- keep new work job-ticket-first unless the owner deliberately expands scope again;
- prefer coherent workflow slices or clearly necessary stabilization follow-ups;
- keep the current report review filters, CSV export, and time-review workspace working;
- continue avoiding purchasing or inventory expansion as the default next move.

### Explicitly still not approved
- warehouse transfer workflows;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring;
- broad ERP-style operational expansion.

### Migration rule for future approved schema changes
- if a future approved task truly needs a schema or index change, add a new forward migration;
- do not rewrite or delete historical migrations.

## Scope Rails
- Keep the work job-ticket-first.
- Keep controllers thin and business rules in application services.
- Use DTO APIs only.
- Preserve soft-delete/archive behavior.
- Keep employee and existing Manager/Admin workflows working.
- Do not weaken auth.
- Do not renumber enums.
- Do not edit old migrations.
- Keep one active PR at a time.

## Validation Requirements Before Merge
Run in a checkout-capable environment:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

Merge readiness requires:
- passing backend build;
- passing frontend build;
- passing backend and frontend tests, or a clearly documented environment limitation;
- docs aligned to implemented behavior;
- no scope drift back into deferred domains.

## Deferred Until Explicitly Re-Approved
- new inventory expansion beyond the already-merged support baseline;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring.
