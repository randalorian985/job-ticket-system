# Slice 006-01: Work Order Core

## Status
Aligned child of Slice 006.

## Goal
Create or repair the minimum valid work-order record and save it without equipment, contacts, assignment, scheduling, or quick-create integration.

## Dependencies
Requires Slices 001-01, 002-01, and applicable completed identity/authorization children.

## Scope
- Audit the existing work-order model, migrations, APIs, forms, routes, permissions, activity history, and tests.
- Reuse existing ticket identity and numbering conventions.
- Require customer Organization and support Service Location according to current business rules.
- Capture status, priority, service/problem description, requested date, internal notes, created-by, and existing required core fields.
- Save, reopen, edit, and cancel/deactivate using existing conventions.
- Validate that the selected location belongs to the selected customer and tenant.
- Preserve existing tickets, history, and direct selectors.

## Acceptance criteria
- An authorized user can create, save, reopen, and edit the minimum valid work order.
- Customer/location validation and tenant isolation are enforced.
- Existing tickets continue to load.
- Core activity history, permissions, tests, and wiki documentation are complete.

## Guardrail
Do not implement quick-create integration, equipment, contacts, assignments, labor, parts, scheduling, or backlog redesign in this child.
