# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented.
- Manager/Admin job-ticket, assignment, reporting, master-data, purchasing-support, and inventory-foundation workflows remain implemented on `main`.
- Parts Request Workflow Phase 2 adds an in-ticket Add / Request Part flow without adding purchasing, receiving, inventory expansion, recommendations, or automatic compatibility decisions.
- Technicians can search/select existing parts through a technician-safe lookup or type a new/unlisted part from inside an assigned service ticket.
- Technicians can mark a selected or unlisted part as `Needs ordered`; those items appear in the Manager/Admin parts request queue.
- If `Needs ordered` is not selected, the item is recorded on the ticket without creating a back-office order/request queue item.
- Technician screens do not expose part cost, billable price, vendor cost, purchase history, catalog cleanup, purchasing, inventory, or invoice-facing billing controls.
- Manager/Admin back-office users can review the parts request queue, filter/search it, update request status, add internal notes, record part cost and billable price snapshots, mark billable state, and match a request to an existing catalog part.
- No dedicated Parts Manager role is added in Phase 2; existing Manager/Admin access remains the back-office authorization boundary.

## Scope Boundary
The project remains centered on the job-ticket workflow:
- assign mechanics to tickets;
- capture job information;
- record work and technician part needs;
- track time;
- support Manager/Admin coordination, reporting, closeout readiness, parts request review, and user management.

Parts Request Workflow Phase 2 is not a purchasing, receiving, vendor invoice, landed-cost, warehouse/truck inventory, replenishment, recommendation, AI/scoring, or automatic compatibility workflow.

## Project Navigation
- Project control center: [docs/build-roadmap.md](docs/build-roadmap.md)
- Scope contract: [docs/project-scope.md](docs/project-scope.md)
- API contract: [docs/api-contract.md](docs/api-contract.md)
- Development setup and validation: [docs/development-setup.md](docs/development-setup.md)
- Test environment setup and workarounds: [docs/test-environment-setup.md](docs/test-environment-setup.md)
- Historical audit log: [docs/historical-bug-regression-audit.md](docs/historical-bug-regression-audit.md)
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
- Do not expose cost, price, vendor, purchase, inventory, catalog-admin, or billing controls to technicians.
- Keep deferred purchasing, inventory expansion, recommendation, AI/scoring, and automatic compatibility domains deferred until explicitly selected.
