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
- Parts Request Workflow Phase 1 is added as a job-ticket-first workflow.
- Technicians can submit part requests from inside an assigned service/job ticket using only part name/description, quantity, notes, urgency, and optional needed-by context.
- Manager/Admin back-office users can review a parts request queue and update request status, internal notes, cost snapshot, billable price snapshot, billable state, and optional catalog part match.
- No dedicated Parts Manager role is added in Phase 1; existing Manager/Admin access remains the back-office authorization boundary.
- No schema migration is required for Phase 1 because the workflow uses existing job-ticket part office-review fields.

## Technician Boundary
Technician-facing parts request screens must stay simple and field-focused.

Allowed technician fields:
- part name or description;
- quantity;
- notes;
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
Manager/Admin users may review and update part requests as an operational ticket-support workflow.

Allowed back-office fields in Phase 1:
- request status;
- internal status notes;
- part cost snapshot;
- billable price snapshot;
- billable state;
- optional catalog part match using existing parts.

This does not approve or implement purchase orders, receiving, vendor invoice tracking, landed cost, warehouse/truck inventory, inventory transactions, low-stock alerts, replenishment, recommendation scoring, AI/ML, automatic compatibility decisions, or automatic approval.

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
The following are not approved as part of Parts Request Workflow Phase 1:
- purchase orders;
- receiving;
- vendor invoice tracking;
- landed cost;
- warehouse inventory;
- truck inventory;
- inventory transactions;
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
