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
- Manager/Admin job-ticket detail includes a clear Parts panel, waiting-on-parts summary, current part/request labels, and in-ticket Add / Request Part controls backed by the existing parts request API.
- Manager/Admin back-office users can review, filter, and search the parts request queue and update request status, internal notes, cost snapshot, billable price snapshot, billable state, and optional catalog part match.
- No dedicated Parts Manager role is added in Phase 2; existing Manager/Admin access remains the back-office authorization boundary.
- No schema migration is required for Phase 2 because the workflow uses existing job-ticket part office-review fields.
- Shared Employee and Manager/Admin UI polish is allowed as stabilization when it only improves spacing, wrapping, responsive layout, visual consistency, loading/empty/error state presentation, and workflow smoothness on existing screens.
- Manager/Admin Service Ticket Workspace Redesign is active as the current UI workflow direction: a more coherent ticket workbench that improves service-ticket flow without expanding into deferred purchasing, inventory, payment, client portal, or recommendation domains.
- The first ticket-detail slice is CSS-led and organizational. It visually groups the existing Manager/Admin ticket-detail workflow around status, dispatch, assignments, service context, billing handoff, notes, parts, labor, time entries, files/photos, closeout readiness, and archive review without changing APIs, authorization, schemas, or technician-safe part boundaries.

## Service Ticket Workspace Direction
The Manager/Admin service-ticket side should move toward a field-service operations workbench rather than a collection of disconnected forms.

Allowed redesign focus:
- ticket overview and status/priority clarity;
- customer, service location, and equipment context near the top of the ticket;
- technician assignments and scheduling/visit context where existing APIs support it;
- service scope, notes, and activity organized around how work actually happens;
- time-entry and labor summary visibility, including labor-rate snapshot labels where relevant;
- parts used or requested from within the ticket, preserving technician-safe and back-office boundaries;
- file/photo visibility from the ticket workspace;
- invoice-ready summary and closeout readiness using existing reporting/closeout behavior;
- responsive Manager/Admin layout that stays scannable on narrow screens;
- inline actions, focused modals, drawers, or panels when they reduce unnecessary page switching.

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
- needed-by date.

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
The following are not approved as part of Parts Request Workflow Phase 2, UI polish stabilization, or Manager/Admin Service Ticket Workspace Redesign:
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
