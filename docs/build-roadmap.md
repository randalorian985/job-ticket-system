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

Parts Request Workflow Phase 1 is the active feature slice in this PR. It adds a technician-to-back-office request flow for parts needed on service/job tickets:
- technician request creation from the assigned job-ticket detail screen;
- simple technician fields only: part description, quantity, notes, urgency, and needed-by date;
- Manager/Admin parts request queue;
- back-office request status, internal notes, part cost, billable price, billable state, and optional catalog match;
- DTO-based API and service implementation;
- no schema migration;
- no Parts Manager role added in Phase 1;
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

## Phase 1 Merge Readiness Checklist
Before merge, confirm:
- scope stayed limited to parts request workflow;
- no deferred purchasing, receiving, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior was added;
- no hard deletes were added;
- no backend enum numeric values changed;
- no migration was added unless CI reveals one is required;
- technicians cannot see or submit cost, billable price, vendor, purchase, inventory, catalog cleanup, or billing controls;
- Manager/Admin can review/update the parts request queue;
- backend and frontend tests cover creation, queue review/update, authorization boundaries, and technician pricing restrictions;
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
