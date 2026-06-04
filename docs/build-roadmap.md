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
The project has been explicitly re-centered on the original job-ticket system scope.

There is no approved inventory-expansion lane on `main` at this time.

Supporting purchasing and inventory work already merged on `main` remains part of the implemented baseline, but it should not drive the next roadmap phase unless the scope is deliberately expanded again later.

The post-reports historical regression audit and docs checkpoint is recorded in [docs/historical-bug-regression-audit.md](./historical-bug-regression-audit.md). The checkpoint passed standard GitHub Actions validation.

Job Ticket Closeout & Invoice-Readiness Workflow Polish is implemented as a Manager/Admin job review enhancement.

Job Ticket Dispatch & Assignment Readiness Polish is the selected job-ticket-first implementation lane. Current implementation progress adds Manager/Admin dashboard and job-ticket list dispatch-readiness rollups, per-ticket readiness cues, named list-row and detail assignment/lead ownership from assignment responses, next-step dispatch fixes for missing list/detail/edit readiness context, dispatch-readiness filtering, detail dispatch-readiness checklist cues with employee-record and ID fallback for assignment names, edit-side dispatch-readiness cues, and Employee assigned-job list/detail field-context cues with next-fix and pre-work guidance using existing job-ticket and assignment APIs.

Test environment setup is now part of the maintained project baseline: docs cover the opt-in Admin bootstrap for empty local/test databases, full pilot seed setup, scheduled-runner workarounds, Docker SQL authentication, custom SQL Server connection strings, named instances, and Windows integrated security guidance.

## Product Boundary We Are Protecting
Keep the platform focused on:
- job ticket creation and editing;
- mechanic assignment workflows;
- job information capture and status flow;
- parts added and tracked on tickets;
- time tracking and related reporting;
- Manager/Admin workflows that directly support the above.

Do not steer the project toward a general ERP build-out.

## Implemented Baseline That Remains On Main
- Core backend/API workflows.
- Employee mobile workflow.
- Manager/Admin Phases 1-3D.
- Phase 4A pilot readiness.
- Phase 4B pilot workflow polish.
- Opt-in local/test Admin bootstrap for empty databases, plus maintained setup docs for test credentials, seeded pilot data, custom connection strings, integrated security, and scheduled-runner workarounds.
- Manager/Admin job-ticket create/edit/detail/list support for scheduling, billing context, purchase-order references, operational notes, assignment/dispatch review cues, edit-side dispatch-readiness cues, detail dispatch-readiness checklist cues, invoice-readiness cues, and status/archive review clarity.
- Manager/Admin job-ticket list, detail, and edit readiness surfaces now show the next dispatch fix for missing assignment, lead-tech, schedule, due-date, or job-instruction context using existing loaded data, with list and detail assignment labels resolving employee names from assignment responses when available.
- Manager/Admin job-ticket workspace UI polish for shell navigation, shared summary cards, filter panels, review panels, form controls, and responsive workspace spacing.
- Manager/Admin dashboard and job-ticket list dispatch-readiness rollups for active tickets that are ready for dispatch versus tickets missing assignment, lead-tech, schedule, or due-date context, plus dispatch-readiness filtering for ready, needs-review, and not-active tickets on the job-ticket list.
- Employee assigned-job list field-context cues plus job-ticket detail field-context cues, next field-context fix guidance, and pre-work guidance for schedule, due date, customer, service location, equipment or no-equipment context, and job instructions using existing assigned-ticket data.
- Manager/Admin closeout/readiness review for labor, time approvals, parts, files/photos, notes, status, customer/equipment context, and billing handoff context without accounting or invoice generation.
- Manager/Admin reports and time-review polish, including loaded-row filters, export-friendly tables, client-side CSV export from visible loaded data, and snapshot-first labor labels.
- Parts Purchase / Vendor Cost Tracking Phase 1.
- Parts Purchase / Vendor Cost Tracking Phase 2.
- Purchasing stabilization follow-ups for submit-state discipline, close-transition discipline, and closed-order receiving-action gating.
- Supporting inventory foundation for stock locations, inventory history, stock visibility, manual adjustments, and purchase-order receipt posting.

## Current Roadmap Gate
The Job Ticket Closeout & Invoice-Readiness Workflow Polish slice is implemented using existing Manager/Admin job-ticket review data and APIs.

The bounded post-reports historical regression audit and docs checkpoint is complete and validated.

The selected implementation lane is Job Ticket Dispatch & Assignment Readiness Polish. Keep implementation to coherent job-ticket-first feature PRs and preserve the scope rails below.

### Selected implementation lane
Job Ticket Dispatch & Assignment Readiness Polish should improve how Manager/Admin users prepare a job ticket for field execution and how employees understand assignment context.

Current implementation in this lane:
- Manager/Admin dashboard and job-ticket list summary cards count dispatch-ready active tickets and active tickets that still need assignment, lead-tech, schedule, or due-date review;
- Manager/Admin job-ticket list rows show whether each ticket is ready for dispatch or which dispatch context is missing;
- Manager/Admin job-ticket list rows show assigned and lead employee names from assignment responses, while falling back to assignment IDs if names are blank;
- Manager/Admin job-ticket list rows now identify the first next dispatch fix when assignment, lead-tech, schedule, or due-date context is missing;
- Manager/Admin job-ticket list filters can isolate dispatch-ready tickets, tickets needing dispatch review, and not-active dispatch tickets;
- Manager/Admin dashboard shows the first next dispatch focus from existing loaded job-ticket and assignment data;
- Manager/Admin job-ticket detail surfaces show a dispatch-readiness checklist and next dispatch fix for assignment ownership, lead tech, scheduled start, due date, customer, service location, and equipment or no-equipment context, including employee names from assignment responses with Admin-loaded employee-record and ID fallback;
- Manager/Admin job-ticket edit surfaces show whether customer, service-location, equipment or no-equipment context, scheduled-start, due-date, and job instruction context are present before dispatch;
- Manager/Admin job-ticket edit surfaces now identify the first next dispatch fix when edit-side readiness context is missing;
- Manager/Admin job-ticket workspace surfaces have clearer navigation, shared summary cards, filter panels, review panels, form controls, and responsive workspace spacing for faster scanning;
- Employee assigned-job list rows show due-date and next field-context fix cues from existing list data, and Employee job-ticket detail surfaces show field-context cues for scheduled start, due date, customer, service location, equipment or no-equipment context, and job instructions, identify the first next field-context fix when manager review is still needed, and show clear pre-work guidance;
- this implementation uses existing job-ticket list/detail data, existing edit DTO fields, and existing assignment endpoints.

Next coherent implementation slice:
- after the current dispatch next-step UX PR is accepted and validated, evaluate the next job-ticket-first dispatch/assignment readiness gap from the current main branch and active PR state;
- keep any edit, detail, employee, or status warnings tied to the existing job-ticket fields and assignment endpoints;
- add focused frontend tests that cover ready and not-ready dispatch-review states;
- update README, project scope, and API contract only if the implementation changes visible behavior or API expectations.

Allowed implementation scope:
- clearer Manager/Admin assignment review and dispatch-readiness cues;
- clearer visibility for assigned employees, lead technician context, schedule timing, due dates, customer, service location, and equipment context;
- validation and error UX around assignment, schedule, and required job-ticket context;
- job-ticket detail/list/edit polish that helps managers see whether a ticket is ready to dispatch;
- employee-facing context improvements for assigned jobs using existing job-ticket, assignment, schedule, customer, service-location, equipment, notes, parts, files/photos, and time-entry data;
- focused tests and docs updates.

Expected implementation posture:
- prefer existing APIs when they already expose the required job-ticket and assignment context;
- if API changes are needed, keep them narrow, DTO-based, job-ticket-first, and documented in [docs/api-contract.md](./api-contract.md);
- keep controllers thin and business logic in application services;
- preserve Manager/Admin and Employee route boundaries;
- preserve soft-delete/archive behavior;
- keep reports, time-review polish, closeout readiness, purchasing support, and inventory foundation behavior stable.

Not included in this lane:
- accounting workflows;
- invoice generation or invoice posting;
- payment tracking;
- purchasing expansion;
- inventory expansion;
- warehouse transfer workflows;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring;
- broad ERP-style expansion;
- auth model changes;
- backend enum renumbering;
- historical migration edits.

### Completed closeout/readiness implementation lane
Job Ticket Closeout & Invoice-Readiness Workflow Polish helps Manager/Admin users review whether a job ticket is ready for invoice handoff without implementing accounting or invoice generation.

Included in the implementation PR:
- Manager/Admin review of job ticket readiness for invoicing;
- clearer closeout cues for labor, time approvals, parts, files/photos, notes, status, and customer/equipment context;
- invoice/readiness status warnings around missing closeout information;
- export and report wording that remains invoice-ready, not accounting or invoice generation;
- focused tests for the closeout/readiness workflow;
- README, API contract, scope, and roadmap updates that match implemented behavior.

Not included in the implementation PR:
- accounting workflows;
- invoice generation or invoice posting;
- payment tracking;
- purchasing expansion;
- inventory expansion;
- warehouse transfer workflows;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring;
- auth model changes;
- backend enum renumbering;
- historical migration edits.

### Scope confirmed by the checkpoint
- known historical bug list re-audited against the current `main` baseline;
- auth, `/health`, employee workflow, Manager/Admin route boundaries, `/manage/users` Admin-only access, and reports/time-review baseline behavior checked against existing regression coverage;
- `README.md`, `docs/project-scope.md`, `docs/api-contract.md`, and `docs/historical-bug-regression-audit.md` aligned to the implemented state;
- no runtime behavior, API behavior, schema, migration, enum, auth, purchasing, inventory, recommendation, or AI/scoring changes included.

### Scope that remains protected after this checkpoint
- keep new work job-ticket-first unless the owner deliberately expands scope again;
- prefer coherent workflow slices or clearly necessary stabilization follow-ups;
- keep the current report review filters, CSV export, time-review workspace, and closeout/readiness review working;
- continue avoiding purchasing or inventory expansion as the default next move.

### Explicitly still not approved
- accounting or invoice generation;
- payment tracking;
- purchasing expansion;
- inventory expansion;
- warehouse transfer workflows;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring;
- broad ERP-style operational expansion.

### Migration rule for future approved schema changes
- if a future approved task truly needs a schema or index change, add a new forward migration;
- do not rewrite or delete historical migrations.

## Scope Rails
- Keep the work job-ticket-first.
- Keep controllers thin and business rules in application services.
- Use DTO APIs only.
- Preserve soft-delete/archive behavior.
- Keep employee and existing Manager/Admin workflows working.
- Do not weaken auth.
- Do not renumber enums.
- Do not edit old migrations.
- Keep one active PR at a time.

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
- accounting or invoice generation;
- new inventory expansion beyond the already-merged support baseline;
- truck inventory;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring.
