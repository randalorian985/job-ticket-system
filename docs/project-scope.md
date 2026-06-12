# Project Scope

## Goal
Build a Job Ticket Management System that allows teams to submit, assign, track, and resolve job tickets while preserving clean API boundaries, role-based authorization, and reviewable workflow slices.

## Product Center Of Gravity
This product is first and foremost a job ticket system.

Core scope:
- assigning mechanics to tickets;
- capturing job information and status;
- recording work performed and parts needed on tickets;
- tracking labor time;
- supporting Employee and Manager/Admin workflows around job-ticket operations.

## Current Control State
- The implemented baseline includes auth, employee mobile workflow, Manager/Admin job-ticket workflow, reporting/time review, master data, purchasing support, and inventory foundation already present on `main`.
- Parts Request Workflow Phase 2 is added as a job-ticket-first workflow.
- Technicians can search/select an existing catalog part through a safe lookup or type a new/unlisted part from inside an assigned service/job ticket.
- Technicians can mark a selected or unlisted part as `Needs ordered`; those items appear in the Manager/Admin back-office parts request queue.
- If `Needs ordered` is not selected, the item is recorded on the ticket without creating a back-office request queue item.
- Technician field recording now requires an open time entry for the selected job ticket before an Employee records work notes, parts, part requests, or file/photo uploads; Manager/Admin back-office actions are not gated by an employee clock-in.
- Manager/Admin job-ticket detail is implemented as a service-ticket workbench with ticket overview, customer, service location, equipment, assignment, service scope, status/priority, time/labor, parts, files/photos, activity, and invoice-ready summary panels.
- Manager/Admin ticket detail uses focused in-page panels for ticket editing, status changes, archive review, and Add / Request Part actions backed by existing APIs.
- Manager/Admin reporting is implemented as a bounded reports hub for the existing reporting domains: invoice/closeout review, job cost summaries, jobs ready to invoice, labor by job, labor by employee, parts by job, customer service history, and equipment service history.
- Reporting UI polish includes clear sections, shared filters, required source-ID validation, loading/empty/error states, export-friendly tables, and client-side CSV export from currently loaded rows only.
- Labor reporting labels totals as time-entry labor-rate snapshot values and keeps the existing API behavior that falls back only for legacy entries without captured snapshots.
- Manager/Admin back-office users can review, filter, and search the parts request queue and update request status, internal notes, cost snapshot, billable price snapshot, billable state, and optional catalog part match.
- No dedicated Parts Manager role is added in Phase 2; existing Manager/Admin access remains the back-office authorization boundary.
- No schema migration is required for Phase 2 because the workflow uses existing job-ticket part office-review fields.
- Shared Employee and Manager/Admin UI polish is implemented as a presentation-only stabilization layer across existing screens. It standardizes typography, compact actions, form density, tables, cards, navigation, responsive layout, and loading/empty/error presentation without changing workflow authorization or API behavior.
- Manager/Admin Service Ticket Workspace Redesign is implemented for the ticket detail/workspace flow without expanding into deferred purchasing, inventory, payment, client portal, notification, approval automation, recommendation, or scoring domains.
- Manager/Admin task navigation now uses URL-backed job-ticket queue filters, dashboard links into exact queues, queue-aware return links, and workflow tabs on ticket detail; these are frontend navigation contracts only and do not change backend APIs or business rules.
- Manager/Admin Time Approval is now a queue-first workflow with default pending-entry loading, employee-name filtering, broad job/customer/site/location search, contextual review details, bulk approve, reject, and edit-and-approve with audit-safe adjustment records.
- The latest post-Time Approval regression audit is recorded in the historical audit log and keeps the project in a clean planning state for the next selected Manager/Admin workflow lane.

## Current Planning Direction
The next feature work should remain a bounded Manager/Admin workflow slice, selected only after any active audit or stabilization PR is closed and GitHub checks are clean.

Recommended next lane:
- Manager/Admin Phase 3B master-data management polish for customers, service locations, equipment, vendors, part categories, and parts, including create/edit/archive forms, validation and error UX, tests, and docs.

Acceptable alternate lanes if deliberately selected:
- Manager/Admin job-ticket management polish for create/edit, assignment management, status/archive confirmation, validation and error UX;
- Admin user-management polish for create/edit/archive/reset-password, role warnings, access messaging, tests, and docs;
- a narrow stabilization or validation PR if checks, review feedback, or audit findings identify a concrete risk.

This planning direction does not approve purchasing expansion, receiving, vendor invoice tracking, landed cost, advanced inventory, recommendations, AI/scoring, automatic compatibility decisions, automatic approval, auth weakening, enum renumbering, hard deletes, or historical migration edits.

## Service Ticket Workspace Direction
The Manager/Admin service-ticket side should move toward a field-service operations workbench rather than a collection of disconnected forms.

Implemented redesign focus:
- ticket overview and status/priority clarity;
- customer, service location, and equipment context near the top of the ticket;
- technician assignments and scheduling/visit context where existing APIs support it;
- service scope, notes, and activity organized around how work actually happens;
- time-entry and labor summary visibility, including labor-rate snapshot labels where relevant;
- parts used or requested from within the ticket, preserving technician-safe and back-office boundaries;
- file/photo visibility from the ticket workspace;
- invoice-ready summary and closeout readiness using existing reporting/closeout behavior;
- responsive Manager/Admin layout that stays scannable on narrow screens;
- focused in-page action panels when they reduce unnecessary page switching;
- shareable queue URLs for status, priority, customer, dispatch readiness, and search filters;
- dashboard summary links that open the corresponding filtered queue;
- queue-aware breadcrumbs that preserve the originating job queue across ticket review;
- ticket workflow tabs for Overview, Dispatch, Time, Parts, Files, Closeout, and Activity, with a visible recommended next action.

The design may take inspiration from field-service lifecycle products and dense repair-ticket detail views, but it must be adapted to Crane's actual job-ticket workflow. The intended flow is work queue to ticket workspace to closeout/invoice-ready review.

This redesign does not approve:
- external customer portal or Client Hub workflow;
- online payments or payment collection;
- quote approval automation;
- customer notification automation;
- new or expanded purchasing behavior;
- receiving expansion;
- vendor invoice tracking;
- landed cost;
- warehouse/truck inventory expansion;
- low-stock alerts;
- replenishment;
- automatic parts recommendations;
- AI/scoring;
- automatic compatibility decisions;
- automatic approval.

## Technician Boundary
Technician-facing parts request screens must stay simple and field-focused.

Allowed technician fields:
- safe part lookup/search by part number, name, or description;
- typed unlisted part name or description;
- quantity;
- notes;
- `Needs ordered` flag;
- urgency;
- needed-by date;
- file/photo uploads that support the assigned ticket work.

Technician field recording rules:
- Employees must have an open time entry for the selected job ticket before recording work notes, adding ticket parts, creating part requests, or uploading ticket files/photos.
- Employees clocked into another job must open that active ticket or clock out before recording field work on a different ticket.
- Manager/Admin back-office review and coordination actions are not gated by an employee clock-in.

Technicians must not enter or see:
- part cost;
- billable price;
- vendor cost;
- purchase history;
- vendor invoice data;
- landed cost;
- catalog/master-data cleanup controls;
- inventory controls;
- invoice-facing billing controls.

## Back-Office Boundary
Manager/Admin users may review and update Needs ordered part requests as an operational ticket-support workflow.

Allowed back-office fields in Phase 2:
- request status;
- internal status notes;
- part cost snapshot;
- billable price snapshot;
- billable state;
- optional catalog part match using existing parts.

Manager/Admin ticket detail may show and create ticket parts/requests, summarize waiting-on-parts state, and route Needs ordered work into the back-office review queue. This remains a ticket-support workflow, not a purchasing or inventory workflow.

This does not approve new or expanded purchase-order behavior beyond the existing purchasing-support baseline, receiving, vendor invoice tracking, landed cost, warehouse/truck inventory expansion, inventory transactions beyond the existing inventory-foundation baseline, low-stock alerts, replenishment, recommendation scoring, AI/ML, automatic compatibility decisions, or automatic approval.

## Protected Baseline
The following must remain stable:
- JWT auth and role enforcement;
- inactive/archived/deleted user token rejection;
- employee assigned-job workflow;
- Manager/Admin routes;
- `/manage/users` Admin-only access;
- DTO-based APIs;
- soft-delete/archive behavior;
- explicit backend enum numeric values;
- README, API contract, project scope, and roadmap alignment.

## Not Approved Right Now
The following are not approved as part of Parts Request Workflow Phase 2, UI polish stabilization, Manager/Admin Service Ticket Workspace Redesign, Time Approval workflow polish, or the current planning direction:
- external customer portal or Client Hub workflow;
- online payments or payment collection;
- quote approval automation;
- customer notification automation;
- new purchase-order expansion beyond the existing purchasing-support baseline;
- receiving expansion;
- vendor invoice tracking expansion;
- landed-cost expansion;
- warehouse inventory expansion beyond the existing inventory-foundation baseline;
- truck inventory expansion;
- inventory transactions beyond the existing inventory-foundation baseline;
- low-stock alerts;
- replenishment workflows;
- recommendation engine;
- AI/scoring;
- automatic compatibility decisions;
- automatic approval;
- hard deletes;
- auth weakening;
- backend enum renumbering;
- historical migration edits.

## Manager/Admin Time Approval Workflow Clarification
- The Time Approval screen is a queue-first Manager/Admin workflow: pending time entries load by default without requiring filter input.
- Optional filters are date range, employee name (resolved to an internal employee ID), approval status, and broad job/customer/site/location search.
- Managers/Admins can review contextual entry details, approve or reject one entry, edit and approve with an audit reason, or bulk approve eligible completed pending entries.
- Existing Manager/Admin authorization boundaries and time-entry approval enum numeric values remain unchanged.
- This clarification does not add payroll, inventory, vendor cost tracking, purchase orders, or parts recommendation scope.

### Manager-first Time Approval refinement
- Time Approval is an automatically loaded pending queue; date, employee-name, status, and broad job/customer/site/location search controls only narrow the loaded queue.
- Managers review contextual employee/job/customer/location information in the table, can approve clean completed entries in bulk, and use individual review for rejection or adjustments.
- Manager edits reuse the existing `TimeEntryAdjustment` audit model and commit adjustment plus approval atomically. The current scaffold has no dedicated break-duration or labor-type assignment fields, so no break editor/column is presented and labor type is populated from the job type when present; no payroll/billing schema was expanded for unsupported concepts.
- No pay-period aggregate exists in the current model, so default dates remain blank while all pending entries are shown.
