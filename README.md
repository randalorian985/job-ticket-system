# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Product Direction
The project is centered on the original job-ticket workflow:
- assign mechanics to tickets;
- capture job information;
- add parts to tickets;
- track time;
- support Manager/Admin coordination, reporting, closeout readiness, and user management around that workflow.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented.
- Manager/Admin Phases 1-3D and Phase 4A/4B remain implemented.
- Manager/Admin reports and time-review polish are implemented on top of the existing reporting and approval surfaces.
- Job Ticket Closeout & Invoice-Readiness Workflow Polish is implemented in the Manager/Admin job review packet without adding accounting, payment tracking, or invoice generation.
- Manager/Admin job ticket list dispatch-readiness cues now summarize active tickets that are ready for dispatch versus tickets missing assignment, lead-tech, or schedule context, using existing job-ticket and assignment APIs.
- Parts Purchase / Vendor Cost Tracking Phase 1 and Phase 2 remain implemented as supporting operational workflows already present on `main`.
- Limited inventory foundation work is already present on `main` as supporting infrastructure.
- The post-reports historical regression audit and docs checkpoint is complete and validated.
- No further inventory expansion is currently approved as the active product lane.
- The selected job-ticket-first implementation lane remains Job Ticket Dispatch & Assignment Readiness Polish, documented in [docs/build-roadmap.md](docs/build-roadmap.md).

## What Main Already Implements
- Job-ticket creation, assignment, execution, reporting, closeout readiness, dispatch readiness, and related Manager/Admin workflows.
- Manager/Admin job-ticket create/edit/detail/list coverage for scheduling, billing context, purchase-order references, operational notes, assignment/dispatch review cues, invoice-readiness cues, and clearer status/archive review actions.
- Manager/Admin job ticket list rollups for active, urgent, waiting, unscheduled, unassigned, needs-lead, dispatch-ready, and needs-dispatch-review tickets.
- Manager/Admin reporting filters, loaded-row review context, snapshot-first labor labels, export-friendly report tables, and client-side CSV export from loaded report data.
- Manager/Admin time review with export-friendly loaded rows, visible-slice filters, summary counts, and CSV export for loaded time-entry review.
- Employee mobile job workflow with GPS time tracking, work notes, part usage, and files/photos.
- Master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Admin-only user management at `/manage/users`.
- Parts usage history visibility with cautious, non-recommendation wording.
- Purchase-order and vendor-cost workflows already merged on `main`.
- Supporting inventory foundation already merged on `main` for stock locations, inventory history, stock visibility, and manual adjustments.

## Scope Boundary
Supporting purchasing and inventory capabilities already exist on `main`, but they are not the product's primary growth path.

Current roadmap discipline:
- keep new work centered on job tickets, parts-on-ticket workflows, assignment workflows, job information, time tracking, closeout readiness, and related Manager/Admin usability;
- use Job Ticket Dispatch & Assignment Readiness Polish as the selected implementation lane, focused on clearer assignment, dispatch, schedule, and readiness review around existing job-ticket data;
- keep reports, time-review polish, and closeout readiness working as part of the existing job-ticket-first reporting and review workflow;
- use the completed checkpoint for historical regression review and docs alignment rather than a new domain expansion;
- treat invoice-readiness as operational handoff review, not accounting, payment tracking, or invoice generation;
- do not treat the project as a general ERP build-out;
- do not resume inventory expansion without an explicit future scope decision.

## Project Navigation
- Project control center: [docs/build-roadmap.md](docs/build-roadmap.md)
- Scope contract: [docs/project-scope.md](docs/project-scope.md)
- API contract: [docs/api-contract.md](docs/api-contract.md)
- Development setup and validation: [docs/development-setup.md](docs/development-setup.md)
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
- Keep deferred domains deferred until the roadmap explicitly advances them.
