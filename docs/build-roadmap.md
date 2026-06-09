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

Manager/Admin Service Ticket Workspace Redesign is merged and protected on `main` for the job-ticket detail/workspace flow:
- the Manager/Admin ticket detail page is organized as a field-service workbench rather than scattered forms;
- ticket overview, customer, service location, equipment, assignments, service scope, status/priority, time/labor, parts, files/photos, activity, and invoice-ready summary are visible as coordinated panels;
- ticket editing, status review, archive review, and Add / Request Part actions use focused in-page panels backed by existing APIs;
- Employee mobile workflow remains unchanged;
- `/manage` remains Manager/Admin-only and `/manage/users` remains Admin-only;
- no backend API behavior, schema, migration, enum, auth, purchasing expansion, inventory expansion, portal, payment, notification, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior was added.

Manager/Admin assignment stabilization is merged and protected on `main`:
- `GET /api/users/assignable-employees` provides a narrow Manager/Admin-safe lookup for active, non-archived Employee-role users;
- full `/api/users` user-management endpoints remain Admin-only;
- the Manager/Admin job-ticket assignment dropdown uses the narrow lookup instead of relying on the Admin-only user list;
- service, integration, and frontend route/workbench tests cover the authorization and dropdown behavior.

Manager/Admin Phase 3C reporting polish and export workflow is merged and protected on `main`:
- reports are organized into invoice/closeout, labor/parts, and service-history sections;
- shared filters, source-ID validation, loading, empty, and error states are implemented on the existing Manager/Admin reports hub;
- report tables remain export-friendly and use client-side CSV export from the currently loaded browser rows only;
- labor totals are labeled around time-entry labor-rate snapshot semantics while preserving the existing API fallback behavior for legacy entries without captured snapshots;
- focused report tests and broader manager-page expectations were updated;
- README, project scope, and API contract docs describe the completed reporting behavior;
- no backend controller, service, DTO, schema, migration, authorization, enum, purchasing expansion, inventory expansion, recommendation, AI/scoring, confidence-score, invoice-generation, payment, client-portal, hard-delete, or historical-migration behavior was added.

There is no active feature PR at this checkpoint. Before selecting another feature lane, run the daily audit guardrails below and confirm the source-of-truth docs still align with `main`. Any next feature task must be explicitly approved by the current roadmap/scope documents and must not pull deferred purchasing expansion, inventory expansion, client portal, payment, notification automation, recommendation, AI/scoring, automatic compatibility, or automatic approval scope forward.

## Implemented Feature Direction: Manager/Admin Service Ticket Workspace
This implemented UI workflow phase used field-service lifecycle inspiration and dense repair-ticket detail views to make service tickets feel like one coherent workbench instead of scattered forms.

Design inspiration came from mature service-repair and field-service tools, especially:
- field-service lifecycle flow: schedule, assign, perform work, close out, and invoice-ready review;
- dense ticket-detail workbenches: ticket header, customer/location/equipment context, line-item work sections, parts, files/photos, and a right-side operational summary.

The Crane implementation adapts those ideas to this system's actual scope:
- keeps the Manager/Admin ticket detail page as the primary service-ticket workspace;
- organizes the workspace around real operating flow: ticket overview, customer, service location, equipment, assignments, service scope, status/priority, time/labor, parts used or requested, files/photos, activity, and invoice-ready summary;
- uses focused in-page action panels where existing APIs already support the action;
- keeps Employee mobile workflow simple and field-focused;
- keeps Manager/Admin routes protected and `/manage/users` Admin-only;
- keeps technician-safe part lookup from exposing cost, billable price, vendor, purchase, inventory, catalog-admin, or billing controls;
- keeps cautious parts-history wording and avoids automatic recommendation language.

The redesign does not copy a POS/retail flavor directly. Crane's service-ticket side remains an internal field-service operations surface: work queue, ticket workspace, technician assignment, labor/parts/photos, and invoice-ready closeout.

Future service-ticket workspace follow-up PRs must be stabilization, validation, or explicitly approved feature slices. They should update README, project scope, API contract, and this roadmap only when implemented behavior or scope changes.

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
