# Slice 006-03: Work Order Equipment Assignment

## Status
Aligned child of Slice 006.

## Goal
Attach one or more existing Customer Equipment records to a work order without adding Equipment quick-create.

## Dependencies
Requires Slices 006-01 and 004-02.

## Scope
- Audit existing ticket-equipment relationships, APIs, forms, validation, ordering, and history.
- Select active equipment belonging to the chosen customer and Service Location.
- Support one or more equipment units while keeping the common one-equipment flow simple.
- Add, remove, and reorder equipment relationships where the existing model supports ordering.
- Preserve equipment-specific notes and existing relationship details.
- Reject cross-customer, cross-location, and cross-tenant equipment.
- Save and reopen all relationships reliably.
- Handle customer or location changes with controlled validation rather than silently keeping invalid equipment.

## Acceptance criteria
- One-equipment and multiple-equipment work orders save and reopen correctly.
- Existing ticket-equipment links remain intact.
- Mismatched equipment cannot be newly selected.
- Customer/location changes surface and resolve invalid relationships safely.
- Focused backend, frontend, and end-to-end tests plus documentation are complete.

## Guardrail
Do not implement Equipment quick-create, contacts, assignments, scheduling, labor, or parts in this child.
