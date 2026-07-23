# Slice 006-02: Organization and Location Quick-Create Integration

## Status
Aligned child of Slice 006.

## Goal
Integrate reusable Organization and Service Location quick-create into work-order intake without losing unsaved work.

## Dependencies
Requires Slices 006-01, 001-02, and 002-02.

## Scope
- Audit existing customer, billing-organization, and Service Location inline-create behavior.
- Launch the canonical Organization quick-create from applicable selectors.
- Launch the canonical Service Location quick-create only after customer context exists.
- Preserve all unsaved work-order state while a child flow is open.
- Prefill known role, customer, and location context.
- Automatically select the newly created record after successful save.
- Return to the unchanged work order after cancel, validation failure, or save failure.
- Enforce caller permissions, tenant isolation, validation, duplicate warnings, and focus return.

## Acceptance criteria
- Missing Organizations and Service Locations can be created without leaving or resetting intake.
- Successful save selects the new record.
- Cancel and failure preserve all work-order fields and selections.
- Unauthorized users cannot execute the create action.
- Focused integration and end-to-end tests plus documentation are complete.

## Guardrail
Do not implement equipment, contacts, assignments, scheduling, or a general quick-add redesign in this child.
