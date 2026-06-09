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
- stale catalog-part selection guards on Manager/Admin and Employee in-ticket Add / Request Part forms;
- no backend API, DTO, schema, migration, enum, auth, role, purchasing, inventory, recommendation, AI/scoring, accounting, payment, invoice-generation, or hard-delete changes;
- no new business workflow beyond the existing implemented screens.

There is no active feature PR at this checkpoint. The next approved feature direction is Manager/Admin Service Ticket Workspace Redesign, a UI workflow phase that uses field-service lifecycle inspiration and dense repair-ticket detail views to make service tickets feel like one coherent workbench instead of scattered forms.

## Next Approved Feature Task: Manager/Admin Service Ticket Workspace Redesign
This is a feature/UI workflow PR, not a purchasing, inventory, payment, client-portal, or recommendation PR.

Design inspiration may come from mature service-repair and field-service tools, especially:
- field-service lifecycle flow: schedule, assign, perform work, close out, and invoice-ready review;
- dense ticket-detail workbenches: ticket header, customer/location/equipment context, line-item work sections, parts, files/photos, and a right-side operational summary.

The Crane implementation should adapt those ideas to this system's actual scope:
- keep the Manager/Admin ticket detail page as the primary service-ticket workspace;
- organize the workspace around real operating flow: ticket overview, customer, service location, equipment, assignments, service scope, status/priority, time/labor, parts used or requested, files/photos, activity, and invoice-ready summary;
- prefer inline editing, focused modals, panels, or drawers over unnecessary full-page jumps when existing APIs already support the action;
- keep Employee mobile workflow simple and field-focused;
- keep Manager/Admin routes protected and `/manage/users` Admin-only;
- keep technician-safe part lookup from exposing cost, billable price, vendor, purchase, inventory, catalog-admin, or billing controls;
- keep cautious parts-history wording and avoid automatic recommendation language.

The redesign should not copy a POS/retail flavor directly. Crane's service-ticket side should feel like an internal field-service operations surface: work queue, ticket workspace, technician assignment, labor/parts/photos, and invoice-ready closeout.

Documentation expectations for the implementation PR:
- update README if completed UI scope changes;
- update project scope when the redesign is implemented or partially implemented;
- update API contract only if API behavior changes;
- keep this roadmap aligned with the accepted outcome.

## Implemented Baseline That Remains Protected
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin job-ticket workflow.
- Master-data lifecycle workflows.
- Reporting and time-review workflows.
- Admin-only user management at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Existing purchasing support and inventory foundation already present on `main`.

## Historical Review Documents
Older review and gap-analysis documents are retained for audit history only. They do not override this roadmap, the README, the project scope, or the API contract.

Historical documents that mention pre-Manager/Admin, Phase 3C/3D pickup, scaffold-era, or local-snapshot guidance should be read as dated evidence from their original review window, not as current task-selection instructions. Current work must start from latest `main`, follow the checkpoint above, and keep deferred purchasing expansion, receiving expansion, inventory expansion, recommendations, AI/scoring, automatic compatibility, and automatic approval out of scope unless explicitly re-approved.

Dated review records that are historical evidence only include:
- `docs/project-pickup-review.md`;
- `docs/scope-code-review.md`;
- `docs/remote-provenance-merge-readiness.md`;
- `docs/post-merge-roadmap-reset.md`;
- `docs/current-state-code-review.md`;
- `docs/full-code-review-gap-analysis.md`;
- `docs/code-review-stabilization.md`.

When any of those files use words like "current", "active", "next", or "pickup", interpret that wording in the context of the document date, not as present-day roadmap approval.

## Daily Audit Guardrails Before Next Feature Work
Before starting the next feature PR, confirm:
- no active stabilization, validation, or audit PR is still open;
- no deferred purchasing expansion, receiving, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior is being pulled forward accidentally;
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
- new purchase-order expansion beyond the existing purchasing-support baseline;
- receiving expansion;
- vendor invoice tracking expansion;
- landed-cost expansion;
- warehouse inventory expansion beyond the existing inventory-foundation baseline;
- truck inventory expansion;
- inventory transactions beyond the existing baseline;
- low-stock alerts;
- replenishment workflows;
- external client portal or Client Hub workflow;
- online payments or payment collection;
- quote approval automation;
- customer notification automation;
- compatibility recommendation engine;
- AI/scoring;
- automatic compatibility decisions;
- automatic approval.
