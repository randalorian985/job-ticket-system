# Project Scope

## Goal
Build a Job Ticket Management System that allows teams to submit, assign, track, and resolve job tickets while preserving clean API boundaries, role-based authorization, and reviewable workflow slices.

## Current Control State
- `main` remains complete through the validated post-Phase-4 baseline and Parts Purchase / Vendor Cost Tracking Phase 2.
- This branch is the active **Advanced Inventory Phase 1** draft and is no longer a planning-only checkpoint.
- The active lane remains warehouse-first and Manager/Admin-only.
- Employee workflow and existing Manager/Admin workflow must continue working while this branch evolves.

Current roadmap sequencing is controlled in [docs/build-roadmap.md](./build-roadmap.md).

## Advanced Inventory Phase 1 On This Branch
### Already implemented in this draft
- Managed stock locations with soft-delete/archive behavior.
- Inventory transaction persistence for the new inventory foundation.
- Manager/Admin-only DTO/API coverage for:
  - stock-location list/detail/create/update/archive/unarchive;
  - stock summary reads;
  - recent inventory transaction reads;
  - manual stock adjustments with required reasons.
- Transaction-history-backed on-hand visibility for the new inventory endpoints.
- A schema migration for the new stock-location and inventory-transaction tables.
- Focused backend inventory service regression coverage.

### Still required before this phase is complete
- Post purchase-order receiving into inventory transactions so receipt activity updates inventory history.
- Add Manager/Admin UI coverage for the warehouse-first workflow.
- Keep the source-of-truth docs aligned with the implemented branch behavior.
- Run the standard backend/frontend validation commands in a checkout-capable environment.

### Explicitly out of scope
- truck inventory workflows;
- cross-location transfers;
- replenishment automation;
- pick/reserve/issue workflow automation;
- compatibility recommendations;
- AI/scoring-based recommendation logic;
- auth model changes.

## Implemented Baseline That Must Stay Stable
- Auth, JWT token revalidation, and role enforcement for `Admin`, `Manager`, and `Employee`.
- Employee mobile workflow for assigned jobs, GPS time tracking, work notes, part usage, and files/photos.
- Manager/Admin job-ticket workflow, assignment management, archive/status UX, and reporting hub.
- Manager/Admin master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Manager/Admin Admin-only user management workflow at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Purchasing workbench plus dedicated purchase-order workflow, receiving progress, vendor invoice tracking, landed-cost recording, close validation, and archive/unarchive behavior.

## Architectural And Safety Rules
- Keep controllers thin.
- Keep business logic in application services.
- Use DTOs for API requests and responses.
- Do not expose EF entities directly from APIs.
- Preserve soft-delete/archive behavior instead of hard delete.
- Do not weaken authorization.
- Do not renumber backend enums.
- Do not edit historical migrations unless explicitly required.

## Deferred Scope Confirmation
The following remain deferred and must not be partially introduced by this branch:
- truck inventory workflows;
- cross-location inventory transfers;
- replenishment automation;
- pick/reserve/issue automation;
- parts compatibility recommendation engine;
- AI/scoring-based part recommendations.
