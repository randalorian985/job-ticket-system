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
- Manager/Admin reports and time-review polish are part of the implemented baseline.
- Job Ticket Closeout & Invoice-Readiness Workflow Polish is part of the implemented Manager/Admin job review baseline.
- Job Ticket Dispatch & Assignment Readiness Polish is the selected implementation lane.
- Test environment setup and documentation are maintained as stabilization support for the existing product: empty-database Admin bootstrap, full pilot seed setup, scheduled-runner workarounds, custom connection strings, named SQL Server instances, and Windows integrated security guidance. This does not expand product domain scope.
- Manager/Admin dashboard and job ticket list dispatch-readiness cues now summarize active tickets that are ready for dispatch versus tickets missing assignment, lead-tech, schedule, or due-date context, name the next dispatch focus or fix from loaded data, show assigned and lead employee names on list rows from assignment responses, and filter by dispatch-readiness state on the job-ticket list using existing job-ticket and assignment APIs.
- Manager/Admin job ticket detail readiness cues now summarize assignment ownership, lead tech, active dispatch status, customer, service location, equipment or no-equipment context, schedule, and due date using existing job-ticket and assignment data, name the next dispatch fix, show employee names from assignment responses with employee-record and ID fallback, and treat assignment-load failures as unavailable assignment data instead of empty assignment lists.
- Manager/Admin job ticket edit readiness cues now summarize customer, service location, equipment or no-equipment context, schedule, due date, and job instruction context using existing job-ticket fields, and name the next edit-side dispatch fix when one is missing.
- Manager/Admin job-ticket workspace UI now has clearer shell navigation, shared workspace styling, summary-card emphasis, filter panels, review panels, form controls, and responsive spacing for operational scanning.
- Employee assigned-job list rows now show due-date, active field-work status, and next field-context fix cues from existing assigned-job list data, while Employee job ticket detail field-context cues summarize active field-work status, schedule, due date, customer, service location, equipment or no-equipment context, and job instruction context, name the next field-context fix, and show pre-work guidance when field context still needs manager review using existing assigned-ticket detail data.
- Employee workflow and existing Manager/Admin workflow must continue working while future job-ticket-centric phases are chosen and built.

Current roadmap sequencing is controlled in [docs/build-roadmap.md](./build-roadmap.md).

## Implemented Baseline That Must Stay Stable
- Auth, JWT token revalidation, and role enforcement for `Admin`, `Manager`, and `Employee`.
- Local/test environment support for opt-in Admin bootstrap without full seeded data, plus documented seeded pilot setup and database connection-string options.
- Employee mobile workflow for assigned jobs, GPS time tracking, work notes, part usage, files/photos, active-status-aware assigned-job list/detail field-context review, next field-context fix guidance, and pre-work context guidance.
- Manager/Admin job-ticket workflow, assignment management, archive/status UX, reporting hub, inline status/archive review feedback, closeout/invoice-readiness review, dashboard dispatch-readiness summary, dispatch-readiness list cues and filters, active-status-aware detail dispatch-readiness checklist and next-fix cues, edit-side dispatch-readiness cues, and time-review approval workspace.
- Manager/Admin job-ticket create/edit/detail/list support for scheduling, billing context, purchase-order references, operational notes, lead-tech/assignment review cues, invoice-readiness cues, dispatch-readiness rollups, next-step dispatch fixes, workspace visual polish, and clearer status-change confirmation.
- Manager/Admin reporting filters, export-friendly loaded tables, client-side CSV export from loaded report data, visible review context, and snapshot-first labor labels.
- Manager/Admin master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Manager/Admin Admin-only user management workflow at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Purchasing workbench plus dedicated purchase-order workflow, receiving progress, vendor invoice tracking, landed-cost recording, close validation, and archive/unarchive behavior.
- Supporting inventory foundation already merged on `main` for stock locations, inventory history, stock visibility, manual adjustments, and receipt-posted inventory transactions.

## Selected Next Lane
Job Ticket Dispatch & Assignment Readiness Polish is the selected job-ticket-first workflow lane.

The lane should improve how Manager/Admin users prepare a job ticket for field execution and how employees understand assignment context, while staying on the existing job-ticket product surface.

Current implementation in this lane:
- Manager/Admin dashboard and job-ticket list rollups now count active tickets that are dispatch-ready and active tickets that still need assignment, lead-tech, schedule, or due-date review;
- each Manager/Admin job-ticket list row now names whether dispatch readiness is ready or needs review, using only existing job-ticket and assignment data;
- Manager/Admin job-ticket list rows now show assigned and lead employee names from assignment responses, with assignment-id fallback when names are blank;
- Manager/Admin job-ticket list rows now show the first next dispatch fix for missing assignment, lead-tech, schedule, or due-date context using existing loaded list and assignment data;
- the Manager/Admin job-ticket list can filter loaded rows by dispatch-ready, needs-dispatch-review, and not-active dispatch states without changing the API surface;
- the Manager/Admin dashboard now shows the first next dispatch focus from existing loaded job-ticket and assignment data;
- the Manager/Admin job-ticket detail page now summarizes dispatch readiness for assignment ownership, lead tech, scheduled start, due date, customer, service location, equipment or no-equipment context, and the same active dispatch statuses used by dashboard/list readiness using existing job-ticket and assignment data, including employee names from assignment responses with Admin-loaded employee-record and ID fallback;
- the Manager/Admin job-ticket edit form now summarizes dispatch edit-readiness for customer, service location, equipment or no-equipment context, scheduled start, due date, and job instruction context using existing job-ticket fields;
- the Manager/Admin job-ticket edit form now shows the next edit-side dispatch fix from the current ticket fields so Manager/Admin users can see the first missing readiness item before save;
- the Manager/Admin job-ticket workspace now uses clearer shell navigation, shared summary cards, filter panels, review panels, form controls, and responsive workspace spacing;
- the Employee assigned-job list now shows due-date, active field-work status, and next field-context fix cues from existing list data, while the Employee job-ticket detail page summarizes field context for active field-work status, scheduled start, due date, customer, service location, equipment or no-equipment context, and job instructions, names the first next field-context fix, then surfaces pre-work guidance when manager review is still needed, using existing assigned-ticket detail data.

Allowed implementation scope for this lane:
- clearer Manager/Admin assignment review and dispatch-readiness cues;
- clearer visibility for assigned employees, lead technician context, schedule timing, due dates, customer, service location, and equipment context;
- validation and error UX around assignment, schedule, and required job-ticket context;
- job-ticket detail/list/edit polish that helps managers see whether a ticket is ready to dispatch;
- employee-facing context improvements for assigned jobs when they rely on existing job-ticket, assignment, schedule, customer, service-location, equipment, notes, parts, files/photos, and time-entry data;
- focused tests and documentation updates for the selected lane.

The lane should not implement:
- accounting or invoice generation;
- payment tracking;
- purchasing expansion;
- inventory expansion;
- warehouse transfer workflows;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI or scoring;
- broad ERP-style expansion;
- auth model changes;
- backend enum renumbering;
- historical migration edits.

## Scope Boundary For New Work
New work should stay centered on the job-ticket product surface:
- job-ticket workflow polish;
- assignment workflow clarity;
- dispatch-readiness and assignment-context review;
- job information completeness, including scheduling, purchase-order, billing-contact, and note context;
- closeout and invoice-readiness review for labor, parts, files/photos, notes, status, and customer/equipment context;
- parts-on-ticket quality;
- time-tracking and related reporting polish;
- targeted stabilization that protects those workflows.

Supporting purchasing and inventory code already exists on `main`, but further expansion in those domains is not the active product direction.

Reports and time-review polish are part of the protected baseline: loaded-row filters, export-friendly review tables, visible-row CSV export, and clearer labor-snapshot wording should remain intact after the closeout/readiness lane.

Closeout and invoice-readiness polish is operational review only. It helps Manager/Admin users identify whether the existing ticket record has labor, time-approval, parts, file/photo, note, status, and billing-handoff context before invoice handoff. It does not create invoices, post accounting entries, or track payments.

Test-environment setup, bootstrap credentials, seeded demo data, and database connection guidance are stabilization support for reliable local/test validation. They do not create production seed data or approve product-domain expansion.

The completed checkpoint re-audited auth, routing, employee workflow, Manager/Admin workflow, reports/time-review behavior, and the known historical bug list. It does not approve domain expansion by itself.

## Completed Closeout And Readiness Lane
Job Ticket Closeout & Invoice-Readiness Workflow Polish is implemented as a Manager/Admin job review enhancement.

The lane includes:
- Manager/Admin review of job ticket readiness for invoicing;
- clearer closeout cues for labor, parts, files/photos, notes, status, and customer/equipment context;
- status-review warnings when invoice/readiness transitions still have open closeout items;
- operational wording that remains invoice-ready without accounting, invoice generation, or payment tracking;
- focused frontend tests and docs updates.

The lane does not implement accounting, invoice generation, payment tracking, purchasing expansion, inventory expansion, compatibility recommendations, AI/scoring, or broad ERP behavior.

## Not Approved Right Now
The following are not approved as current implementation lanes:
- accounting or invoice generation;
- payment tracking;
- purchasing expansion;
- inventory expansion;
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
