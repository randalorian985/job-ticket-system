# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

## Current Project State
- Core backend/API workflows remain implemented and validated.
- Employee mobile workflow remains implemented with a concise assigned-job list and a clock-in-first job detail flow that keeps notes, parts, photos, and history behind the active job state.
- Manager/Admin job-ticket, assignment, reporting, master-data, and purchasing-support workflows remain implemented on `main`; Inventory is hidden from the menu and client wiki until that workflow is completed.
- Manager/Admin Phase 3B master-data polish has started with expanded existing-field create/edit forms and active-only relationship defaults for customers, service locations, equipment, vendors, part categories, and parts, while preserving existing archive/unarchive workflows and APIs.
- Manager/Admin reports are organized into invoice/closeout, labor/parts, and service-history sections with shared filters, source-ID validation, date/paging validation, loading/empty/error states, export-friendly tables, browser print/save-PDF output from generated results, and client-side CSV export from the currently loaded rows.
- Manager/Admin screen cleanup separates report catalog/results, master-data list/editor, and Admin user list/editor states into focused screens without changing backend APIs; Admin user management now filters accounts by search, role, and active/inactive status.
- Manager/Admin job-ticket queue can switch between rich readiness cards and a persisted compact operating list, and can export the currently visible filtered ticket rows to client-side CSV for dispatch handoff without adding backend export APIs.
- Manager/Admin Dispatch at `/manage/dispatch` is the shared schedule for active job tickets. Its focused Unscheduled Tickets, Today, Tomorrow, and Next 7 Days views support one Schedule & Assign action plus guarded En Route, On Site, Start Work, Complete Work, and Open Ticket actions using existing APIs. Completed work, ticket review, and billing stay in the ticket workspace and Reports.
- Production deployment configuration and readiness runbooks are source-controlled, with explicit migration startup, disabled normal production seed/bootstrap services, health proxying, backup/restore guidance, rollback steps, and client-UAT gates documented.
- Controlled production-demo readiness is documented with a source-controlled SQL/uploaded-files backup verification script and clear full go-live gates.
- Labor report totals are labeled as time-entry labor-rate snapshot values and preserve the existing API fallback behavior for legacy entries without captured snapshots.
- Parts Request Workflow Phase 2 adds in-ticket Add / Request Part flows without adding purchasing, receiving, inventory expansion, recommendations, or automatic compatibility decisions.
- Technicians can search/select existing parts through a technician-safe lookup or type a new/unlisted part from inside an assigned service ticket.
- Technicians can mark a selected or unlisted part as `Needs ordered`; those items appear in the Manager/Admin parts request queue.
- If `Needs ordered` is not selected, the item is recorded on the ticket without creating a back-office order/request queue item.
- Technicians must be clocked into the selected job ticket before recording field work through work notes, parts, part requests, or file/photo uploads; Manager/Admin back-office actions are not gated by an employee clock-in.
- Manager/Admin service-ticket detail now presents a cohesive field-service workbench with ticket overview, customer, service location, equipment, assignments, service scope, status/priority, time/labor, parts, files/photos, activity, and invoice-ready summary panels.
- Manager/Admin ticket actions use URL-backed focused workflow panels for section-based ticket editing, quick notes, photo/file upload, labor review, status review, archive review, and Add / Request Part while staying on existing ticket, part-request, assignment, file, time, and reporting APIs.
- Manager/Admin ticket workflow guidance now highlights the recommended next action, target workflow, workflow path, mobile quick actions, and invoice-review requirements without changing backend APIs or business workflow.
- Manager/Admin task navigation uses URL-backed queue filters, dashboard links into filtered queues, queue-aware return links, workflow tabs, and a recommended next action that opens the selected ticket workflow in a focused view.
- Technician screens do not expose part cost, billable price, vendor cost, purchase history, catalog cleanup, purchasing, inventory, or invoice-facing billing controls.
- Manager/Admin back-office users can review the parts request queue, filter/search it, update request status, add internal notes, record part cost and billable price snapshots, mark billable state, and match a request to an existing catalog part.
- No dedicated Parts Manager role is added in Phase 2; existing Manager/Admin access remains the back-office authorization boundary.
- A shared presentation system now polishes every existing Employee and Manager/Admin route with consistent typography, compact actions, form controls, tables, cards, navigation, responsive behavior, and loading/empty/error states.
- Local pilot seed data includes six demo tickets across invoice-ready, assigned, waiting-on-parts, unassigned, needs-lead, and urgent in-progress scenarios for Employee, Dispatch, Manager/Admin queue, parts, and reports walkthroughs.

## Current UI Direction
The Manager/Admin Service Ticket Workspace Redesign is implemented for the job-ticket detail/workspace flow, and the same restrained operational design system is applied across the rest of the existing application.

The service-ticket side now centers on one job-ticket record: the queue creates and finds tickets, Dispatch schedules active tickets, the ticket workspace captures and reviews the work, and Reports supports invoice-ready review. The design direction remains adapted to Crane's job-ticket scope.

This UI direction does not approve external client portals, online payments, quote approval automation, customer notification automation, purchasing expansion, inventory expansion, parts recommendations, AI/scoring, automatic compatibility, or automatic approval.

Dispatch is intentionally ticket-backed, not a second work module. A crane/equipment selection identifies the customer's unit being serviced; it is not a dispatched company resource or employee assignment. Specific components or parts being serviced belong in the ticket's job scope and instructions. Dispatch does not add a separate record, table, status enum, schema migration, automatic scheduling, automatic approval, or invoice generation.

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
- Client-facing system wiki: [docs/system-wiki.md](docs/system-wiki.md)
- Service-ticket workflow audit: [docs/service-ticket-workflow-audit.md](docs/service-ticket-workflow-audit.md)
- Development setup and validation: [docs/development-setup.md](docs/development-setup.md)
- Test environment setup and workarounds: [docs/test-environment-setup.md](docs/test-environment-setup.md)
- Production readiness runbook: [docs/production-readiness-runbook.md](docs/production-readiness-runbook.md)
- Production demo readiness: [docs/production-demo-readiness-2026-06-22.md](docs/production-demo-readiness-2026-06-22.md)
- Production readiness audit: [docs/production-readiness-audit-2026-06-18.md](docs/production-readiness-audit-2026-06-18.md)
- Wiki screenshot refresh note: [docs/wiki-screenshot-refresh-2026-06-22.md](docs/wiki-screenshot-refresh-2026-06-22.md)
- Historical audit log: [docs/historical-bug-regression-audit.md](docs/historical-bug-regression-audit.md)
- Database design: [docs/database-design.md](docs/database-design.md)
- Local demo runbook: [docs/local-demo-runbook.md](docs/local-demo-runbook.md)

## Public Platform Endpoints
- `GET /health`
- `GET /api/system/info`

## Local Docker Demo
Docker dev enables local pilot seed data. Demo users:
- `pilot.admin` / `PilotDemo123!`
- `pilot.manager` / `PilotDemo123!`
- `pilot.tech` / `PilotDemo123!`
- `pilot.tech.backup` / `PilotDemo123!`
- Bootstrap-only admin: `test.admin` / `TestAdmin123!`

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
- Keep deferred purchasing expansion, inventory expansion, recommendation, AI/scoring, and automatic compatibility domains deferred until explicitly selected.
