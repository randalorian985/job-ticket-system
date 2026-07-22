# Slice 006-02: Work Order Equipment

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Attach one or more existing or newly quick-created customer equipment records to a work order without complicating the normal one-equipment workflow.

## Dependencies
Requires Slice 006-01 and Slice 004.

## Scope
- Audit the existing ticket-equipment relationships, APIs, forms, validation, history, and any existing quick-add behavior.
- Select equipment belonging to the chosen customer and service location.
- Support one or more equipment units per work order.
- Make the common one-equipment flow simple while providing an explicit Add Equipment action.
- Preserve equipment order, notes, and existing ticket-equipment details where already supported.
- Prevent cross-customer, cross-location, and cross-tenant equipment selection.
- Save and reopen all equipment relationships reliably.
- Integrate the reusable Equipment quick-create capability from Slice 004 when the required unit does not yet exist.

## Work-order quick-add integration rules
- Require valid customer and service-location context before equipment quick-create opens.
- Prefill the selected customer and location.
- Preserve all unsaved work-order and equipment-selection state.
- Automatically attach and select the newly created equipment after a successful save.
- Cancel or failed save must return to the unchanged work order.
- Hide or disable equipment quick-create when the user lacks equipment-create permission.

## Acceptance criteria
- An authorized user can add, remove, and reorder supported equipment relationships.
- One-equipment and multiple-equipment work orders save and reopen correctly.
- Changing the customer or location produces controlled validation and does not silently retain invalid equipment.
- Missing equipment can be created from the work order and automatically attached without leaving intake.
- Cancel and failed save preserve the work-order state.
- Existing ticket-equipment data remains intact.
- Tests and wiki documentation are updated.

## Guardrail
Do not implement contacts, technician assignment, scheduling, labor, parts, or unrelated quick-add redesign in this slice.