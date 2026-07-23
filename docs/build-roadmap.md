# Build Roadmap (Project Control Center)

## Source Of Truth
This document controls delivery sequencing, merge readiness, and scope discipline for the Crane / Job Ticket System.

## Consistency Standard
- Keep terminology, workflow order, and UI sectioning consistent across the app and the steering docs.
- If a lane changes labels or flow order, update the scope, wiki, and audit docs in the same PR so they continue to describe the same system.
- Prefer shared patterns over screen-specific variations unless the workflow genuinely differs.

Use this roadmap together with:
- [README.md](../README.md)
- [docs/project-scope.md](./project-scope.md)
- [docs/api-contract.md](./api-contract.md)
- [docs/schema-redesign-domain-contract.md](./schema-redesign-domain-contract.md)
- [docs/codex-model-routing.md](./codex-model-routing.md)
- [docs/development-setup.md](./development-setup.md)
- [docs/test-environment-setup.md](./test-environment-setup.md)
- [docs/historical-bug-regression-audit.md](./historical-bug-regression-audit.md)

## Active Epic: Schema Redesign Epic 0

Epic 0 is the active documentation-only architecture lane. Its deliverable is an explicitly reviewed domain contract covering terminology, module ownership, relationship cardinality, invariants, historical snapshot rules, fitment verification, notes, rate history, worked examples, and the first data-profiling boundary.

Source of truth: [Schema Redesign Domain Contract](./schema-redesign-domain-contract.md).

Epic 0 must not add migrations, backfills, APIs, DTOs, screens, automatic fitment behavior, or destructive cleanup. The next implementation lane remains blocked until the contract's pending steering decisions are resolved and its approval status is changed from `In review` to `Approved`.

## Codex Delivery Routing

[Codex Model Routing](./codex-model-routing.md) controls the recommended model, reasoning level, and execution mode for planning, implementation, review, and release tasks. Every future implementation task must declare its model, reasoning level, execution mode, escalation condition, required review, and approval gate.

The default route is Standard mode with GPT-5.6 Terra at Medium reasoning for approved, bounded implementation. Complex implementation escalates to Terra High; architecture and risk review use GPT-5.6 Sol at High reasoning; Sol Extra High is reserved for destructive migrations, cutovers, historical-data integrity, critical security decisions, or unresolved evidence. Model selection does not authorize work that remains blocked by Epic 0 or another steering gate.

## Current Roadmap Checkpoint
The project remains explicitly centered on the original job-ticket system scope.

Employee/Manager workflow stabilization is implemented:
- Employee `/jobs` is a concise assigned-work list without extra dashboard panels;
- Employee job detail is clock-in-first, showing ticket context, readiness, a plain-language Next action card, and time controls before clock-in, then revealing notes, parts, photos, work entries, parts, and files only while clocked into that ticket;
- Manager/Admin `/manage/job-tickets` keeps the existing rich readiness card view and adds a persisted compact list view that reduces row clutter around ticket, lead/team, readiness, timing, and Open Ticket;
- Admin `/manage/ticket-status-filters` configures the Manager/Admin queue status filter boxes using display labels, existing ticket status values, display order, and active/inactive flags;
- Employee assigned-job lists hide fully closed `Completed`, `Cancelled`, `Invoiced`, and `Reviewed` tickets while Manager/Admin users keep queue, workspace, report, and history access;
- pilot seed data now creates six demo job tickets across ready-for-invoice, assigned, waiting-on-parts, unassigned, needs-lead, and urgent in-progress scenarios;
- documentation and client wiki wording are aligned to the simplified Employee flow, compact queue mode, service-equipment meaning, and VPS post-merge checklist;
- this adds only the bounded ticket-status-filter configuration API/table/migration and does not change backend enum numeric values, lifecycle transitions, auth boundaries, purchasing expansion, receiving expansion, inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, customer portal, payment, or invoice-generation behavior.

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

Manager/Admin ticket detail cleanup was completed on July 8, 2026:
- affected modules: `frontend/src/pages/manager/JobTicketDetailPage.tsx`, `frontend/src/pages/manager/jobTicketDetail/*`, shared styles, ticket detail tests, route/page notes, README, project scope, and client wiki documentation;
- the separate job-ticket workflow preview route was removed after the approved design was folded into the live ticket workspace;
- the live ticket detail screen now uses one next action, a smaller Quick Actions rail, a Status rail card, practical tabs, and Files upload wording;
- the old workflow path cards, ticket KPI strip, assignment-requirements rail card, and duplicated scheduling context were removed from the live ticket detail page;
- Scheduling is presented as the handoff module from submitted tickets and the quick action rail, while the legacy `dispatch` tab remains the internal value for the user-facing Technicians tab until Scheduling owns all assignment editing;
- no backend API behavior, schema, migration, enum, auth, role, scheduling engine, automatic scheduling, automatic approval, purchasing expansion, inventory expansion, recommendation/scoring/AI, client portal, payment, or invoice-generation behavior was added.

Manager/Admin Section-Based Ticket Editing and Quick Actions was implemented on June 17, 2026:
- affected modules: `frontend/src/pages/manager/JobTicketDetailPage.tsx`, `frontend/src/pages/manager/JobTicketEditorForm.tsx`, ticket detail/editor tests, shared styles, and client wiki documentation;
- the old single long Edit Ticket form is replaced by section navigation for Basics, Customer & Equipment, Scope & Notes, Billing, and Schedule;
- quick actions now expose Add Note, Add File, Review Labor, and Change Status from the ticket workbench action rail;
- Add Note uses the existing job-ticket work-entry API; Add File uses the existing job-ticket file upload API; Review Labor opens the existing Labor tab; Change Status keeps the existing guarded status review panel;
- no database schema, migration, enum, authorization, route, backend API, DTO, purchasing, receiving, inventory expansion, recommendation/scoring/AI, automatic compatibility, or automatic approval behavior was added.

Manager/Admin Dispatch Board was retired on June 23, 2026 after review of the real operating workflow:
- affected modules: Manager/Admin routing/navigation, Job Tickets queue, dashboard, ticket workspace, ticket editor, route tests, README, project scope, API contract, roadmap, and client wiki documentation;
- Job Tickets is now the main operating screen for creating, assigning, scheduling, filtering, and reviewing work;
- `/manage/dispatch` is retained only as a legacy redirect to `/manage/job-tickets`;
- the standalone Dispatch Board component, helper, and tests were removed;
- assignment and schedule checks live on the job ticket and use existing assignment, schedule, status, and ticket update APIs;
- the implementation remains ticket-backed and does not add a dispatch-job table, backend enum values, migrations, automatic scheduling, automatic approval, customer-signature API, billing/payment API, purchasing expansion, inventory expansion, recommendation/scoring/AI, or automatic compatibility behavior.

Service-equipment meaning was corrected throughout the active system on June 22, 2026:
- people are assigned to tickets; the crane/equipment field identifies the customer's unit being serviced;
- component-only work is described in the ticket job scope or service instructions;
- the UI no longer presents the customer's crane as an assigned resource or raises same-equipment resource conflicts;
- `JobTicketListItemDto` now includes the optional equipment ID so the ticket preserves the service-equipment selection without a schema or write-DTO change.

Manager/Admin Service Ticket Workflow Audit and repair was completed on June 18, 2026:
- affected modules: `frontend/src/pages/manager/JobTicketDetailPage.tsx`, `frontend/src/pages/manager/JobTicketDetailPage.test.tsx`, shared styles, page/route developer notes, client wiki documentation, and ticket workflow screenshots;
- direct workflow-tab and action-rail navigation now opens the selected ticket workflow in the focused `view=workflow` screen;
- Edit Ticket, Change Status, Archive Review, Add Note, Add File, Review Labor, and Add / Request Part now land users on the relevant focused panel or tab with stronger focus/contrast feedback;
- **Back to ticket overview** closes open focused drawers before returning to the normal ticket overview;
- the audit report is documented in `docs/service-ticket-workflow-audit-2026-06-18.md`;
- no backend API behavior, schema, migration, enum, auth, role, purchasing, receiving, inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, invoice-generation, payment, or customer portal behavior was added.

Active client-facing workflow tightening was completed on June 18, 2026:
- the former Dispatch Board copy clarified that En Route and On Site were ticket-history updates while the board remained backed by existing ticket status values;
- the former Dispatch cards labeled the loaded ticket title as Job / Scope instead of presenting it as a separate job-type field;
- Purchasing support now gives visible success/error and in-progress feedback for create, submit, receiving, close, archive, and vendor-invoice save actions;
- the client wiki was aligned to those active workflow behaviors;
- no backend API, schema, migration, enum, auth, role, inventory reintroduction, purchasing expansion, recommendation/scoring/AI, automatic compatibility, or automatic approval behavior was added.

Production readiness hardening was completed on June 18, 2026:
- production Docker Compose and nginx health-proxy configuration are now source-controlled;
- production startup uses an explicit `DatabaseMigrations__ApplyOnStartup` switch instead of relying on test/demo seed hosted services for migration execution;
- production Compose disables test bootstrap and pilot demo seeding during normal restarts;
- job-ticket file/photo uploads enforce the existing 50 MB boundary in the application service as well as at the HTTP request limit;
- production backup, verification, rollback, monitoring, and client-UAT gates are documented in `docs/production-readiness-runbook.md` and `docs/production-readiness-audit-2026-06-18.md`;
- no schema migration, historical migration edit, API route/DTO change, enum change, auth weakening, purchasing expansion, receiving expansion, inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, client portal, payment, or invoice-generation behavior was added.

Manager/Admin ticket workflow refinement was completed on June 18, 2026:
- the ticket overview next-action card now names the next step, destination, and visible blocker count;
- the later July cleanup removed the temporary workflow path cards; tabs remain the in-ticket navigation;
- mobile ticket overview adds compact Add Note, Add File, Labor, and Status shortcuts near the top of the page;
- Invoice Review now surfaces open closeout requirements before invoice-ready totals and keeps direct status/labor/file follow-up actions visible;
- this is a frontend workflow-clarity refinement only and does not add backend APIs, routes, DTOs, schema migrations, enum changes, auth changes, new dispatch models, purchasing expansion, receiving expansion, inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, client portal, payment, or invoice-generation behavior.

Manager/Admin task-navigation and workflow-tab polish is merged and protected on `main`:
- Manager/Admin job queue filters are URL-backed for status, priority, customer, work readiness, and search text;
- Manager dashboard summary links open the corresponding filtered queues;
- Manager/Admin job-ticket queue can export the currently visible filtered ticket rows as client-side CSV;
- ticket detail links preserve safe queue-aware return context;
- ticket detail exposes workflow tabs for Service Details, Technicians, Labor, Parts, Files, Invoice Review, and History, with one visible next action and a Scheduling handoff;
- developer setup validation checks Docker Compose configuration even when `.env` is absent by using `.env.example` safely;
- this polish is a frontend navigation/developer-setup improvement and does not change backend API behavior, business rules, authorization, schema, migrations, enums, purchasing expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior.

Employee field-recording clock-in guard is merged and protected on `main`:
- assigned Employee users must have an open time entry for the selected job ticket before recording field work through work notes, ticket parts, part requests, or file/photo uploads;
- Employee users clocked into a different job are directed to open that active ticket or clock out before recording field work elsewhere;
- Manager/Admin back-office coordination and review actions are not gated by an employee clock-in;
- focused backend, integration, and frontend tests were added for the guard and for the employee UI disabled states;
- no schema migration, enum renumbering, auth weakening, purchasing expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior was added.

Manager/Admin assignment stabilization is merged and protected on `main`:
- `GET /api/users/assignable-employees` provides a narrow Manager/Admin-safe lookup for active, non-archived Employee-role users;
- full `/api/users` user-management endpoints remain Admin-only;
- the Manager/Admin job-ticket assignment dropdown uses the narrow lookup instead of relying on the Admin-only user list;
- service, integration, and frontend route/workbench tests cover the authorization and dropdown behavior.

Manager/Admin Phase 3C reporting polish and export workflow is merged and protected on `main`:
- reports are organized into invoice/closeout, labor/parts, and service-history sections;
- shared filters, source-ID validation, date/paging validation, loading, empty, and error states are implemented on the existing Manager/Admin reports hub;
- report tables remain export-friendly and use browser print/save-PDF output plus client-side CSV export from the currently loaded browser rows only;
- labor totals are labeled around time-entry labor-rate snapshot semantics while preserving the existing API fallback behavior for legacy entries without captured snapshots;
- focused report tests and broader manager-page expectations were updated;
- README, project scope, and API contract docs describe the completed reporting behavior;
- no backend controller, service, DTO, schema, migration, authorization, enum, purchasing expansion, inventory expansion, recommendation, AI/scoring, confidence-score, invoice-generation, payment, client-portal, hard-delete, or historical-migration behavior was added.

Manager/Admin Phase 3D Admin user-management closeout is merged and protected on `main`:
- Admin-only user management keeps focused list/editor screens for create, edit, deactivate, and password reset workflows;
- the user list adds client-side account search plus role and active/inactive filters so Admins can find accounts without changing `/api/users`;
- inactive Admin user screens are not kept mounted behind hidden panels, avoiding duplicate inactive controls in the DOM;
- focused Admin user-management regression tests cover filtering and existing account actions;
- no auth weakening, role expansion, backend API, schema, migration, enum, hard-delete, or deferred-domain behavior was added.

Manager/Admin Phase 3B master-data management polish is merged and protected on `main`:
- expanded Manager/Admin master-data create/edit forms now expose current DTO fields for customer contact/account/billing details, service-location address/contact/site-context details, equipment ownership/billing/model/serial/type details, vendor contact/account details, part category descriptions, and part description/stock/reorder values;
- required text fields are blocked from submitting whitespace-only values;
- archive/unarchive actions on customer, service location, equipment, vendor, part, and part-category records require Manager/Admin confirmation before the action is sent to the API;
- edit-mode forms have explicit cancel-edit controls so users can leave a form without committing changes;
- part forms block negative cost, billable price, quantity-on-hand, and reorder-threshold values;
- equipment year validation keeps values between 1900 and 2100;
- equipment customer and service-location selectors stay aligned so a mismatched customer/location relationship cannot be submitted;
- list filters prefill blank create forms for service-location customer, equipment customer, part category, and preferred vendor where active non-archived filters are present;
- archived relationship records are excluded from blank create-form selectors while preserved during edit mode;
- no backend API, schema, migration, enum, auth, hard-delete, purchasing expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior was added.

Global notification banner, 401 handler, GPS fallback, session timeout warning, compatible parts catalog, and dedicated scheduling module are merged and protected on `main` as of July 6, 2026:
- a global sticky notification banner receives `success`, `warning`, and `error` messages from any screen; the `NotificationContext` and `NotificationBanner` components are available application-wide and auto-dismiss `success` messages after a few seconds;
- a 401 handler registered in `AuthContext` clears the token and surfaces a clear session-expired message through the notification banner without an unhandled redirect;
- a session timeout warning parses the JWT `exp` claim and shows a `warning` notification at 5 minutes before expiry and an `error` notification at 1 minute before expiry, with timers reset on each login;
- clock-in and clock-out now use a two-step GPS fallback: high-accuracy attempt first (12-second timeout), low-accuracy fallback (8-second timeout, 30-second max age), then proceeds without coordinates if both fail; the confirmation message notes when no GPS signal was available; the backend accepts nullable `ClockInLatitude`/`ClockInLongitude` and no longer rejects clock-in/out requests when coordinates are absent (migration `MakeClockCoordsOptional`);
- the ticket create wizard no longer includes a separate Schedule step; `requestedAtUtc` is captured in the Basics step at creation time; scheduling fields remain available in edit mode through the Schedule section of the section-based editor;
- equipment compatible parts catalog adds a `CompatibleParts` tab on the equipment editor; Managers/Admins can maintain a catalog of known-compatible parts per equipment record with optional notes and PM flag; the tab also shows read-only part usage history for that equipment; backend adds the `EquipmentCompatibleParts` table, `EquipmentCompatiblePartsService`, and `GET/POST/DELETE/PATCH /api/equipment/{equipmentId}/compatible-parts` endpoints under `ManagerOrAdmin` authorization (migration `AddEquipmentCompatibleParts`);
- a dedicated Scheduling screen at `/manage/schedule` provides three views for Managers/Admins: Unscheduled Queue (open tickets without a scheduled start, sorted by priority), By Date (week view with previous/next navigation and a "This week" reset), and By Technician (week view grouped by assigned employee); backend adds `EstimatedDurationMinutes` on job tickets (migration `AddEstimatedDuration`), `SchedulingService`, and `GET /api/scheduling/unscheduled`, `GET /api/scheduling/calendar`, `GET /api/scheduling/by-technician`, and `POST /api/scheduling/{ticketId}/schedule` endpoints under `ManagerOrAdmin` authorization;
- `/manage/dispatch` continues to redirect to `/manage/job-tickets`; the legacy redirect is separate from the new `/manage/schedule` screen;
- no auth weakening, enum renumbering, purchasing expansion, inventory expansion, recommendation, AI/scoring, automatic compatibility, automatic approval, or client-portal behavior was added.

Manager/Admin Time Approval workflow polish is merged and protected on `main`:
- the Time Approval screen is a queue-first Manager/Admin workflow and pending entries load by default;
- optional filters include date range, employee name, approval status, and broad job/customer/site/location search;
- managers can review contextual employee/job/customer/location details, approve clean completed entries in bulk, reject entries with reasons, or edit and approve with an audit reason;
- manager edits reuse existing time-entry adjustment audit behavior and do not add unsupported payroll, break-duration, or labor-type schema concepts;
- helper refactors preserved explicit enum-aligned labels, filter behavior, return context safety, routes, APIs, authorization, database behavior, and UI workflows.

The post-Time Approval historical regression audit checkpoint is merged and recorded in `docs/historical-bug-regression-audit.md`. This roadmap update names the next planning lane only; it does not start or implement a new feature workflow.

## Previous Selected Planning Lane (Superseded By Epic 0)
Before Schema Redesign Epic 0 was selected, the recommended next lane was a stabilization and test-coverage pass across the features added on July 6, 2026. The items remain backlog context but are not the active lane:
- frontend tests for notification banner display, dismiss, and auto-dismiss behavior;
- frontend tests for 401 handler showing the session-expired message and clearing auth state;
- frontend tests for session timeout warning timer setup and cleanup;
- frontend tests for GPS fallback flow on `JobDetailPage` (high accuracy → low accuracy → null);
- frontend tests for the compatible parts tab on the equipment editor (load, add, edit, remove);
- frontend tests for the Schedule page (tab switching, unscheduled queue, week navigation);
- backend integration test coverage for `EquipmentCompatiblePartsController` (GET/POST/DELETE/PATCH);
- backend integration test coverage for `SchedulingController` (unscheduled, calendar, by-technician, schedule action).

Acceptable alternatives if deliberately selected:
- compatible parts visibility for technicians: when a technician adds a part to a ticket for a specific piece of equipment, surface the known-compatible parts catalog for that equipment in the safe part lookup; this must preserve the existing technician-safe boundary and not expose cost, billable price, vendor, or catalog-admin fields;
- a narrow stabilization, validation, security, or audit PR if checks, review feedback, or audit findings identify a concrete risk.

Before selecting another feature lane, run the daily audit guardrails below and confirm the source-of-truth docs still align with `main`. Any next feature task must be explicitly approved by the current roadmap/scope documents and must not pull deferred purchasing expansion, inventory expansion, client portal, payment, notification automation, recommendation, AI/scoring, automatic compatibility, or automatic approval scope forward.

## Implemented Feature Direction: Manager/Admin Service Ticket Workspace
This implemented UI workflow phase used field-service lifecycle inspiration and dense repair-ticket detail views to make service tickets feel like one coherent workbench instead of scattered forms.

Design inspiration came from mature service-repair and field-service tools, especially:
- field-service lifecycle flow: schedule, assign, perform work, close out, and invoice-ready review;
- dense ticket-detail workbenches: ticket header, customer/location/equipment context, line-item work sections, parts, files/photos, and a right-side operational summary.

The Crane implementation adapts those ideas to this system's actual scope:
- keeps the Manager/Admin ticket detail page as the primary service-ticket workspace;
- organizes the workspace around real operating flow: ticket overview, customer, service location, equipment, assignments, service scope, status/priority, time/labor, parts used or requested, files/photos, and invoice-ready summary;
- adds shareable queue URLs, queue-aware breadcrumbs, dashboard-to-queue links, workflow tabs, and a recommended next action where the implemented UI supports them;
- requires technicians to be clocked into the selected ticket before recording field work, preserving the link between time tracking and field records;
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
- Existing purchasing support already present on `main`.
- Inventory remains hidden from Manager/Admin navigation and the client wiki until the workflow is completed, validated, documented, and explicitly reintroduced.

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
- technician field-recording paths remain tied to an open time entry for the same job ticket;
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
- warehouse inventory expansion;
- truck inventory expansion;
- inventory workflow reintroduction or expansion;
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
