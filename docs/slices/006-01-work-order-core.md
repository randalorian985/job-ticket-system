# Slice 006-01: Work Order Core

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Create or repair the minimum valid work-order record and save it without scheduling.

## Dependencies
Requires Slices 001, 002, and the applicable completed identity foundation.

## Scope
- Audit the existing job-ticket/work-order model, APIs, forms, routes, permissions, activity history, tests, and any existing quick-add behavior.
- Reuse the existing ticket identity and numbering conventions.
- Require a customer organization.
- Support a service location when required by the existing business rules.
- Capture status, priority, problem/service description, requested date, internal notes, created-by, and existing required fields.
- Save, reopen, edit, and deactivate/cancel according to existing conventions.
- Preserve tenant isolation and historical tickets.
- Integrate the reusable Organization quick-create capability from Slice 001 into the customer and billing-organization selectors where applicable.
- Integrate the reusable Service Location quick-create capability from Slice 002 after a customer is selected.

## Work-order quick-add integration rules
- Preserve all unsaved work-order fields while quick-create is open.
- Prefill customer context for new service locations.
- Return to the same work-order state after save or cancel.
- Automatically select the newly created Organization or Service Location after a successful save.
- A failed quick-create save must not discard or reset the work order.
- Hide or disable quick-create actions when the user lacks the related master-data create permission.

## Acceptance criteria
- An authorized user can create the minimum valid work order.
- The work order appears in the existing system and reopens with all core fields intact.
- Existing tickets continue to load.
- Missing customer organizations and service locations can be created from intake without leaving or losing the work order.
- Successful quick-create automatically selects the new record.
- Cancel and failed save preserve the existing work-order state.
- Validation, activity history, permissions, tests, and wiki documentation are updated.

## Guardrail
Do not add equipment, ticket contacts, assignments, labor, parts, scheduling, or unrelated quick-add redesign in this slice.