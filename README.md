# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

This branch is not on the pre-inventory baseline anymore. It is the active **Advanced Inventory Phase 1** draft and already adds the first backend inventory foundation on top of the validated post-Phase-4 and post-purchasing baseline.

## Current Branch State
- Core backend/API workflows remain implemented and validated on the baseline.
- Employee mobile workflow remains implemented.
- Manager/Admin Phases 1-3D and Phase 4A/4B remain implemented.
- Parts Purchase / Vendor Cost Tracking Phase 1 and Phase 2 remain implemented.
- This draft branch now adds Manager/Admin inventory backend foundations for stock locations, inventory transactions, stock summary reads, recent transaction history, and manual stock adjustments.
- This branch also adds the first inventory schema migration and focused backend inventory service tests.
- Purchase-order receiving still does **not** post receipt transactions into inventory on this branch yet.
- Manager/Admin inventory UI coverage is still pending on this branch.

## What This Draft Already Implements
- `StockLocation` persistence with soft-delete/archive behavior.
- `InventoryTransaction` persistence with appended enum values only (`Receipt=1`, `ManualAdjustment=2`).
- Manager/Admin-only `/api/inventory` endpoints for stock locations, stock summary, recent transactions, and manual adjustments.
- Transaction-history-backed stock visibility for the new inventory endpoints.
- Manual adjustments that require a reason and recalculate `Part.QuantityOnHand` from persisted inventory history for the affected part.

## What Must Still Land On This Same PR Before Merge
- Post purchase-order receiving into inventory transactions so receipt activity updates the new inventory history.
- Add Manager/Admin UI coverage for the warehouse-first inventory workflow.
- Keep `README.md`, `docs/build-roadmap.md`, `docs/project-scope.md`, and `docs/api-contract.md` aligned with the implemented branch behavior.
- Run the standard backend and frontend validation commands in a checkout-capable environment.

## Scope Rails For This Branch
- No truck inventory.
- No cross-location transfers.
- No replenishment automation.
- No pick/reserve/issue automation.
- No compatibility recommendation engine.
- No AI/scoring-based recommendation logic.
- No auth weakening, enum renumbering, or historical migration edits.

## Project Navigation
- Project control center: [docs/build-roadmap.md](docs/build-roadmap.md)
- Scope contract: [docs/project-scope.md](docs/project-scope.md)
- API contract: [docs/api-contract.md](docs/api-contract.md)
- Development setup and validation: [docs/development-setup.md](docs/development-setup.md)
- Database design: [docs/database-design.md](docs/database-design.md)
- Local demo runbook: [docs/local-demo-runbook.md](docs/local-demo-runbook.md)

## Public Platform Endpoints
- `GET /health`
- `GET /api/system/info`

## Validation Commands
Run from repository root in a checkout-capable environment:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

## Architectural Rules That Still Apply
- Keep controllers thin.
- Keep business logic in application services.
- Use DTO-based APIs.
- Preserve soft-delete/archive behavior.
- Keep Employee and Manager/Admin route boundaries intact.
- Treat `/manage` as Manager/Admin-only and `/manage/users` as Admin-only.
- Keep deferred domains deferred until the roadmap explicitly advances them.
