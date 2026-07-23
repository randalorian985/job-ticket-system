# Slice 006-04: Equipment Quick-Create Integration

## Status
Aligned child of Slice 006.

## Goal
Integrate reusable Customer Equipment quick-create into work-order equipment selection without losing intake state.

## Dependencies
Requires Slices 006-03 and 004-03.

## Scope
- Launch canonical Customer Equipment quick-create only when valid customer and Service Location context exists.
- Prefill and clearly display customer and location.
- Preserve all unsaved work-order and equipment-selection state.
- Automatically attach and select the newly created equipment after successful save.
- Return to the unchanged work order after cancel, validation failure, or save failure.
- Enforce Equipment-create permission, tenant isolation, duplicate warnings, and focus return.
- Preserve existing multiple-equipment behavior.

## Acceptance criteria
- Missing physical equipment can be created and attached without leaving or resetting intake.
- Successful save selects the new equipment relationship.
- Cancel and failure preserve work-order and equipment-selection state.
- Invalid customer/location context prevents the action.
- Focused integration and end-to-end tests plus documentation are complete.

## Guardrail
Do not implement contact assignment, Person quick-create, technician assignment, scheduling, or general quick-add infrastructure in this child.
