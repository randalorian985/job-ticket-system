# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented.
- Manager/Admin Phases 1-3D and Phase 4A/4B remain implemented.
- Parts Purchase / Vendor Cost Tracking Phase 1 and Phase 2 remain implemented.
- Advanced Inventory Phase 1 is now implemented on `main`.
- Advanced Inventory Phase 2 is now the next approved lane on `main`.

## What Main Already Implements
- `StockLocation` persistence with soft-delete/archive behavior.
- `InventoryTransaction` persistence with appended enum values only (`Receipt=1`, `ManualAdjustment=2`).
- Manager/Admin-only `/api/inventory` endpoints for stock locations, stock summary, recent transactions, and manual adjustments.
- Manager/Admin `/manage/inventory` workflow for stock-location management, stock visibility, recent transactions, and manual adjustments.
- Transaction-history-backed stock visibility for the new inventory endpoints.
- Manual adjustments that require a reason and recalculate `Part.QuantityOnHand` from persisted inventory history for the affected part.
- Purchase-order receiving that now posts receipt transactions into the inventory history and updates on-hand quantity.

## Approved Next Lane: Advanced Inventory Phase 2
- Manager/Admin-only warehouse transfer workflow built on the existing stock-location and inventory-history foundation.
- Transfer creation and validation between existing active stock locations.
- Inventory-history and stock-visibility updates that keep transfer activity reviewable.
- Focused backend and frontend tests plus aligned source-of-truth docs before merge.

## Scope Rails For The Current Inventory Baseline
- No truck inventory.
- No transfer workflows outside the bounded warehouse-to-warehouse Manager/Admin lane.
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
