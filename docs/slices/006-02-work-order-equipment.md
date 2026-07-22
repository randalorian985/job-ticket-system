# Slice 006-02: Work Order Equipment

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Attach one or more existing customer equipment records to a work order without complicating the normal one-equipment workflow.

## Dependencies
Requires Slice 006-01 and Slice 004.

## Scope
- Audit the existing ticket-equipment relationships, APIs, forms, validation, and history.
- Select equipment belonging to the chosen customer and service location.
- Support one or more equipment units per work order.
- Make the common one-equipment flow simple while providing an explicit Add Equipment action.
- Preserve equipment order, notes, and existing ticket-equipment details where already supported.
- Prevent cross-customer, cross-location, and cross-tenant equipment selection.
- Save and reopen all equipment relationships reliably.

## Acceptance criteria
- An authorized user can add, remove, and reorder supported equipment relationships.
- One-equipment and multiple-equipment work orders save and reopen correctly.
- Changing the customer or location produces controlled validation and does not silently retain invalid equipment.
- Existing ticket-equipment data remains intact.
- Tests and wiki documentation are updated.

## Guardrail
Do not implement equipment quick-add, contacts, technician assignment, scheduling, labor, or parts in this slice.