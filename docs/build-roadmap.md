# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/development-setup.md](./development-setup.md)
- [docs/test-environment-setup.md](./test-environment-setup.md)
- [docs/historical-bug-regression-audit.md](./historical-bug-regression-audit.md)

## Current Roadmap Checkpoint
The project remains explicitly centered on the original job-ticket system scope.

Parts Request Workflow Phase 2 is merged and protected on `main`. It builds on Phase 1 and smooths the service-ticket parts workflow:
- technician-safe part lookup from the assigned job-ticket detail screen;
- selecting existing catalog parts without exposing cost, price, vendor, inventory, catalog-admin, or billing fields;
- typing new/unlisted parts when a catalog match is not found;
- a clear `Needs ordered` flag during in-ticket part add/request;
- Needs ordered items flow to the Manager/Admin parts request queue;
- non-ordered items are recorded on the ticket without creating queue items;
- Manager/Admin job-ticket detail includes a Parts panel, waiting-on-parts summary, current request/review labels, and in-ticket Add / Request Part controls;
- Manager/Admin queue search/status filtering and request review updates;
- catalog matching, status, notes, cost snapshot, billable price snapshot, and billable state remain back-office only;
- pilot seed data includes realistic catalog parts and existing/unlisted Needs ordered examples;
- no schema migration;
- no Parts Manager role added in Phase 2;
- no purchasing, receiving, vendor invoice, landed cost, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

Shared frontend UI polish and responsive workflow stabilization across existing Employee and Manager/Admin surfaces is merged and protected on `main`:
- shared spacing, wrapping, and mobile layout hardening;
- clearer responsive manager navigation and compact operational panels;
- contained admin/report table overflow on narrow screens;
- no backend API, DTO, schema, migration, enum, auth, role, purchasing, inventory, recommendation, AI/scoring, accounting, payment, invoice-generation, or hard-delete changes;
- no new business workflow beyond the existing implemented screens.

There is no active feature PR at this checkpoint. The next roadmap task should be selected only after any open audit or validation follow-up is resolved and required GitHub checks are passing.

## Implemented Baseline That Remains Protected
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin job-ticket workflow.
- Master-data lifecycle workflows.
- Reporting and time-review workflows.
- Admin-only user management at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Existing purchasing support and inventory foundation already present on `main`.

## Daily Audit Guardrails Before Next Feature Work
Before starting the next feature PR, confirm:
- no active stabilization, validation, or audit PR is still open;
- no deferred purchasing, receiving, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior is being pulled forward accidentally;
- no hard deletes were added;
- no backend enum numeric values changed;
- no migration was added unless a schema/index change requires it;
- no authorization boundaries or route guards were weakened;
- technician parts/request screens still do not expose cost, billable price, vendor, purchase, inventory, catalog cleanup, or billing controls;
- existing Employee and Manager/Admin workflows remain reachable and responsive on narrow screens;
- README, project scope, API contract, and roadmap docs align with the implemented `main` state;
- validation commands pass in CI or a checkout-capable environment.

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
- no scope drift back into deferred domains.

## Deferred Until Explicitly Re-Approved
- purchase orders or purchasing expansion;
- receiving expansion;
- vendor invoice tracking expansion;
- landed-cost expansion;
- warehouse inventory;
- truck inventory;
- inventory transactions beyond the existing baseline;
- low-stock alerts;
- replenishment workflows;
- compatibility recommendation engine;
- AI/scoring;
- automatic compatibility decisions;
- automatic approval.
