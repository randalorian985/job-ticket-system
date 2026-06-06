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

Parts Request Workflow Phase 2 is the active feature slice in this PR. It builds on Phase 1 and smooths the service-ticket parts workflow:
- technician-safe part lookup from the assigned job-ticket detail screen;
- selecting existing catalog parts without exposing cost, price, vendor, inventory, catalog-admin, or billing fields;
- typing new/unlisted parts when a catalog match is not found;
- a clear `Needs ordered` flag during in-ticket part add/request;
- Needs ordered items flow to the Manager/Admin parts request queue;
- non-ordered items are recorded on the ticket without creating queue items;
- Manager/Admin queue search/status filtering and request review updates;
- catalog matching, status, notes, cost snapshot, billable price snapshot, and billable state remain back-office only;
- pilot seed data includes realistic catalog parts and existing/unlisted Needs ordered examples;
- no schema migration;
- no Parts Manager role added in Phase 2;
- no purchasing, receiving, vendor invoice, landed cost, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

## Implemented Baseline That Remains Protected
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin job-ticket workflow.
- Master-data lifecycle workflows.
- Reporting and time-review workflows.
- Admin-only user management at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Existing purchasing support and inventory foundation already present on `main`.

## Phase 2 Merge Readiness Checklist
Before merge, confirm:
- scope stayed limited to in-ticket parts request workflow polish;
- no deferred purchasing, receiving, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior was added;
- no hard deletes were added;
- no backend enum numeric values changed;
- no migration was added unless CI reveals one is required;
- technicians can select existing parts and add unlisted parts from a ticket;
- technicians can mark `Needs ordered`;
- technicians cannot see or submit cost, billable price, vendor, purchase, inventory, catalog cleanup, or billing controls;
- Manager/Admin can filter/search and review/update the parts request queue;
- backend and frontend tests cover lookup, creation, queue review/update, authorization boundaries, seed data, and technician pricing restrictions;
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
