# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Product Direction
The project is centered on the original job-ticket workflow:
- assign mechanics to tickets;
- capture job information;
- add parts to tickets;
- track time;
- support Manager/Admin coordination, reporting, and user management around that workflow.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented.
- Manager/Admin Phases 1-3D and Phase 4A/4B remain implemented.
- Parts Purchase / Vendor Cost Tracking Phase 1 and Phase 2 remain implemented as supporting operational workflows already present on `main`.
- Limited inventory foundation work is already present on `main` as supporting infrastructure.
- No further inventory expansion is currently approved as the active product lane.
- The roadmap is re-centered on job-ticket-first follow-up work.

## What Main Already Implements
- Job-ticket creation, assignment, execution, reporting, and related Manager/Admin workflows.
- Manager/Admin job-ticket create/edit/detail coverage for scheduling, billing context, purchase-order references, operational notes, and assignment/dispatch review cues.
- Employee mobile job workflow with GPS time tracking, work notes, part usage, and files/photos.
- Master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Admin-only user management at `/manage/users`.
- Parts usage history visibility with cautious, non-recommendation wording.
- Purchase-order and vendor-cost workflows already merged on `main`.
- Supporting inventory foundation already merged on `main` for stock locations, inventory history, stock visibility, and manual adjustments.

## Scope Boundary
Supporting purchasing and inventory capabilities already exist on `main`, but they are not the product's primary growth path.

Current roadmap discipline:
- keep new work centered on job tickets, parts-on-ticket workflows, assignment workflows, job information, time tracking, and related Manager/Admin usability;
- do not treat the project as a general ERP build-out;
- do not resume inventory expansion without an explicit future scope decision.

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
