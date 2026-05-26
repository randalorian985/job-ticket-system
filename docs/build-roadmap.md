# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/development-setup.md](./development-setup.md)

## Current Roadmap Checkpoint
There is one approved next implementation lane on `main`: **Advanced Inventory Phase 2**.

**Advanced Inventory Phase 1 is complete on `main`.** The backend inventory foundation, purchase-order receipt posting, and Manager/Admin inventory UI coverage are all merged. The next approved slice should stay bounded to a Manager/Admin warehouse transfer workflow built on the existing stock-location and inventory-history foundation.

## Baseline Completed Before This Lane
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin Phases 1-3D.
- Phase 4A pilot readiness.
- Phase 4B pilot workflow polish.
- Parts Purchase / Vendor Cost Tracking Phase 1.
- Parts Purchase / Vendor Cost Tracking Phase 2.
- Purchasing stabilization follow-ups for submit-state discipline, close-transition discipline, and closed-order receiving-action gating.

## Advanced Inventory Phase 1 Completed On Main
### Implemented
- Managed stock locations.
- Inventory transaction persistence.
- Manager/Admin inventory API surface for stock locations, stock summary, recent transactions, and manual adjustments.
- Manager/Admin UI coverage for the warehouse-first inventory workflow.
- Transaction-history-backed stock visibility for the new inventory endpoints.
- Purchase-order receipt posting into inventory transactions and on-hand quantity updates.
- One inventory migration.
- Focused backend inventory service tests.
- Focused frontend inventory workflow tests.

## Advanced Inventory Phase 2 Approved Next
### Planned scope
- Manager/Admin-only warehouse transfer workflow between existing active stock locations.
- Transfer validation for source and destination selection, positive quantity, available-stock protection, and same-location rejection.
- Inventory-history visibility for transfer activity within the existing stock and transaction views.
- Focused backend and frontend regression coverage.
- Source-of-truth docs aligned to the implemented behavior before merge.

### Explicitly not included in this lane
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

## Explicitly Deferred Beyond This Lane
- truck inventory;
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

## What Comes Next
Open exactly one PR from latest `main` for Advanced Inventory Phase 2. Do not branch into truck inventory, replenishment automation, pick/reserve/issue automation, or recommendation work before the bounded warehouse transfer workflow is merged and the roadmap is updated again.
