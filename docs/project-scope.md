# Project Scope

## Goal
Build a Job Ticket Management System that allows teams to submit, assign, track, and resolve job tickets while preserving clean API boundaries, role-based authorization, and reviewable workflow slices.

## Current Control State
- The validated platform baseline remains complete through Phase 4B and Parts Purchase / Vendor Cost Tracking Phase 2.
- Advanced Inventory Phase 1 and Phase 2 are now implemented in the current inventory baseline.
- Employee workflow and existing Manager/Admin workflow must continue working while future phases are chosen and built.

Current roadmap sequencing is controlled in [docs/build-roadmap.md](./build-roadmap.md).

## Current Advanced Inventory Baseline
### Implemented
- Managed stock locations with soft-delete/archive behavior.
- Inventory transaction persistence for the inventory foundation.
- Manager/Admin-only DTO/API coverage for:
  - stock-location list/detail/create/update/archive/unarchive;
  - stock summary reads;
  - recent inventory transaction reads;
  - manual stock adjustments with required reasons;
  - warehouse transfer creation between active stock locations.
- Manager/Admin UI coverage for stock-location management, stock visibility, warehouse transfer entry, recent transaction review, and manual adjustments.
- Transaction-history-backed on-hand visibility for the inventory endpoints.
- Purchase-order receipt posting into inventory transactions and on-hand quantity updates.
- Warehouse-to-warehouse transfer validation for source/destination selection, positive quantity, available-stock protection, and same-location rejection.
- Focused backend inventory service regression coverage.
- Focused frontend inventory workflow regression coverage.

## Implemented Baseline That Must Stay Stable
- Auth, JWT token revalidation, and role enforcement for `Admin`, `Manager`, and `Employee`.
- Employee mobile workflow for assigned jobs, GPS time tracking, work notes, part usage, and files/photos.
- Manager/Admin job-ticket workflow, assignment management, archive/status UX, and reporting hub.
- Manager/Admin master-data lifecycle workflows for customers, service locations, equipment, vendors, part categories, and parts.
- Manager/Admin Admin-only user management workflow at `/manage/users`.
- Parts usage history visibility with cautious non-recommendation wording.
- Purchasing workbench plus dedicated purchase-order workflow, receiving progress, vendor invoice tracking, landed-cost recording, close validation, archive/unarchive behavior, and inventory-linked receipt posting.

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
The following remain deferred and must not be partially introduced by this lane:
- truck inventory workflows;
- transfer workflows outside the bounded warehouse-to-warehouse Manager/Admin lane;
- replenishment automation;
- pick/reserve/issue automation;
- parts compatibility recommendation engine;
- AI/scoring-based part recommendations.
