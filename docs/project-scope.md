# Project Scope

## Goal
Build a Job Ticket Management System that allows teams to submit, assign, track, and resolve job tickets while preserving clean API boundaries, role-based authorization, and reviewable workflow slices.

## Product Center Of Gravity
This product is first and foremost a job ticket system.

That means the core scope is:
- assigning mechanics to tickets;
- capturing job information and status;
- adding and tracking parts on tickets;
- tracking labor time;
- supporting Employee and Manager/Admin workflows around those job-ticket operations.

## Current Control State
- `main` remains complete through the validated post-Phase-4 baseline plus the already-merged purchasing and inventory support baseline.
- The project is now explicitly re-centered on job-ticket-first scope.
- No inventory-expansion lane is currently approved on `main`.
- Manager/Admin reports and time-review polish are now part of the implemented baseline.
- The post-reports historical regression audit and docs checkpoint is complete and validated.
- The next approved implementation lane is Job Ticket Closeout & Invoice-Readiness Workflow Polish.
- The next implementation PR should stay within that one job-ticket-first workflow slice.
- Employee workflow and existing Manager/Admin workflow must continue working while the closeout/readiness lane is built.

Current roadmap sequencing is controlled in [docs/build-roadmap.md](./build-roadmap.md).

## Implemented Baseline That Must Stay Stable
- Auth, JWT token revalidation, and role enforcement for `Admin`, `Manager`, and `Employee`.
- Employee mobile workflow for assigned jobs, GPS time tracking, work notes, part usage, and files/photos.
- Manager/Admin job-ticket workflow, assignment management, archive/status UX, reporting hub, inline status/archive review feedback, and time-review approval workspace.
- Manager/Admin job-ticket create/edit/detail support for scheduling, billing context, purchase-order references, operational notes, lead-tech/assignment review cues, and clearer status-change confirmation.
- Manager/Admin reporting filters, export-friendly loaded tables, client-side CSV export from loaded report data, visible review context, and snapshot-first labor labels.
- Manager/Admin master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Manager/Admin Admin-only user management workflow at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Purchasing workbench plus dedicated purchase-order workflow, receiving progress, vendor invoice tracking, landed-cost recording, close validation, and archive/unarchive behavior.
- Supporting inventory foundation already merged on `main` for stock locations, inventory history, stock visibility, manual adjustments, and receipt-posted inventory transactions.

## Scope Boundary For New Work
New work should stay centered on the job-ticket product surface:
- job-ticket workflow polish;
- assignment workflow clarity;
- job information completeness, including scheduling, purchase-order, billing-contact, and note context;
- closeout and invoice-readiness review for labor, parts, files/photos, notes, status, and customer/equipment context;
- parts-on-ticket quality;
- time-tracking and related reporting polish;
- targeted stabilization that protects those workflows.

Supporting purchasing and inventory code already exists on `main`, but further expansion in those domains is not the active product direction.

Reports and time-review polish are now part of the protected baseline: loaded-row filters, export-friendly review tables, visible-row CSV export, and clearer labor-snapshot wording should remain intact while the closeout/readiness lane is built.

The completed checkpoint re-audited auth, routing, employee workflow, Manager/Admin workflow, reports/time-review behavior, and the known historical bug list. It does not approve domain expansion by itself.

## Approved Next Lane
Job Ticket Closeout & Invoice-Readiness Workflow Polish is approved as the next implementation lane.

The lane may include:
- Manager/Admin review of job ticket readiness for invoicing;
- clearer closeout cues for labor, parts, files/photos, notes, status, and customer/equipment context;
- validation and error UX around missing closeout information;
- export and report wording that remains invoice-ready and operational;
- focused tests and docs updates in the implementation PR.

The lane must not implement accounting, invoice generation, payment tracking, purchasing expansion, inventory expansion, compatibility recommendations, AI/scoring, or broad ERP behavior.

## Not Approved Right Now
The following are not approved as current implementation lanes:
- accounting or invoice generation;
- payment tracking;
- warehouse transfer workflows;
- truck inventory workflows;
- replenishment automation;
- pick/reserve/issue workflow automation;
- compatibility recommendations;
- AI/scoring-based recommendation logic;
- broad ERP-style operational expansion;
- auth model changes.

## Architectural And Safety Rules
- Keep controllers thin.
- Keep business logic in application services.
- Use DTOs for API requests and responses.
- Do not expose EF entities directly from APIs.
- Preserve soft-delete/archive behavior instead of hard delete.
- Do not weaken authorization.
- Do not renumber backend enums.
- Do not edit historical migrations unless explicitly required.
