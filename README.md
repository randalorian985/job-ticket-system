# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented.
- Manager/Admin Phases 1-3D and Phase 4A/4B remain implemented.
- Parts Purchase / Vendor Cost Tracking Phase 1 and Phase 2 remain implemented.
- Advanced Inventory Phase 1 is the current active lane on `main`.

## What Main Already Implements
- `StockLocation` persistence with soft-delete/archive behavior.
- `InventoryTransaction` persistence with appended enum values only (`Receipt=1`, `ManualAdjustment=2`).
- Manager/Admin-only `/api/inventory` endpoints for stock locations, stock summary, recent transactions, and manual adjustments.
- Manager/Admin `/manage/inventory` workflow for stock-location management, stock visibility, recent transactions, and manual adjustments.
- Transaction-history-backed stock visibility for the new inventory endpoints.
- Manual adjustments that require a reason and recalculate `Part.QuantityOnHand` from persisted inventory history for the affected part.
- Purchase-order receiving that now posts receipt transactions into the inventory history and updates on-hand quantity.

## What Still Remains In Advanced Inventory Phase 1
- Keep source-of-truth docs aligned as the inventory lane advances.
- Run the standard backend and frontend validation commands in a checkout-capable environment for future inventory follow-ups.

## Scope Rails For The Current Inventory Lane
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
