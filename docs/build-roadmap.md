# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/development-setup.md](./development-setup.md)

## Current Roadmap Checkpoint
**Advanced Inventory Phase 1 and Phase 2 are now implemented in the current inventory baseline.**

There is no additional inventory implementation lane approved yet beyond the bounded warehouse-to-warehouse transfer workflow. Future work should stay on review follow-ups for this baseline until the next lane is intentionally selected and documented.

## Baseline Completed Before This Lane
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin Phases 1-3D.
- Phase 4A pilot readiness.
- Phase 4B pilot workflow polish.
- Parts Purchase / Vendor Cost Tracking Phase 1.
- Parts Purchase / Vendor Cost Tracking Phase 2.
- Purchasing stabilization follow-ups for submit-state discipline, close-transition discipline, and closed-order receiving-action gating.

## Current Advanced Inventory Baseline
### Implemented
- Managed stock locations.
- Inventory transaction persistence.
- Manager/Admin inventory API surface for stock locations, stock summary, recent transactions, manual adjustments, and warehouse transfers.
- Manager/Admin UI coverage for the warehouse-first inventory workflow.
- Transaction-history-backed stock visibility for the inventory endpoints.
- Purchase-order receipt posting into inventory transactions and on-hand quantity updates.
- Warehouse transfers between existing active stock locations with source/destination validation, positive-quantity enforcement, available-stock protection, and same-location rejection.
- Inventory-history visibility for transfer activity within the shared stock and transaction views.
- One inventory migration.
- Focused backend inventory service tests.
- Focused frontend inventory workflow tests.

## Explicitly Deferred Beyond The Current Baseline
- truck inventory;
- transfer workflows outside the bounded warehouse-to-warehouse Manager/Admin lane;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring.

## Scope Rails For The Current Inventory Baseline
- Keep the work Manager/Admin-only.
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
- no deferred-domain drift.

## What Comes Next
Do not open another inventory implementation PR until the next lane is explicitly selected and documented. If review or validation feedback lands on this transfer baseline, keep the follow-up narrow and on the same active PR until it is ready to merge.
