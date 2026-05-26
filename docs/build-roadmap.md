# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/development-setup.md](./development-setup.md)

## Current Active Lane
There is one active lane on `main`: **Advanced Inventory Phase 1**.

This lane is already past the planning-only checkpoint. The backend inventory foundation is merged, purchase-order receipt posting into inventory is merged, and the next work should stay inside the same phase until it is cleanly completed.

## Baseline Completed Before This Lane
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin Phases 1-3D.
- Phase 4A pilot readiness.
- Phase 4B pilot workflow polish.
- Parts Purchase / Vendor Cost Tracking Phase 1.
- Parts Purchase / Vendor Cost Tracking Phase 2.
- Purchasing stabilization follow-ups for submit-state discipline, close-transition discipline, and closed-order receiving-action gating.

## Advanced Inventory Phase 1 Status On Main
### Already implemented
- Managed stock locations.
- Inventory transaction persistence.
- Manager/Admin inventory API surface for stock locations, stock summary, recent transactions, and manual adjustments.
- Transaction-history-backed stock visibility for the new inventory endpoints.
- Purchase-order receipt posting into inventory transactions and on-hand quantity updates.
- One inventory migration.
- Focused backend inventory service tests.

### Still required before this phase is complete
- Add Manager/Admin UI coverage for the warehouse-first inventory workflow.
- Keep README, roadmap, scope, and API docs aligned with implemented inventory behavior.
- Run the standard backend and frontend validation commands in a checkout-capable environment for future inventory follow-ups.

## Scope Rails For The Active Lane
- Keep the work Manager/Admin-only.
- Keep controllers thin and business rules in application services.
- Use DTO APIs only.
- Preserve soft-delete/archive behavior.
- Keep employee and existing Manager/Admin workflows working.
- Do not weaken auth.
- Do not renumber enums.
- Do not edit old migrations.
- Keep one active PR at a time.

## Explicitly Deferred
- truck inventory;
- cross-location transfers;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring.

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
- no deferred-domain drift.

## What Comes Next After This Phase
Only after Advanced Inventory Phase 1 is complete should the next inventory extension be chosen. Do not branch into truck inventory, transfer workflows, or recommendation work before the warehouse-first foundation and its Manager/Admin workflow land cleanly.
