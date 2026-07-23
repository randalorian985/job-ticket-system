# Slice 006-06: Person Quick-Create Integration

## Status
Aligned child of Slice 006.

## Goal
Integrate reusable Person quick-create into work-order contact selectors without losing work-order state or silently changing saved roles.

## Dependencies
Requires Slices 006-05 and 003-03.

## Scope
- Launch canonical Person quick-create from service-contact and billing-contact selectors.
- Prefill selected Organization and intended ticket role where available.
- Preserve all unsaved work-order and contact-assignment state.
- Automatically select the newly created Person after successful save.
- Keep ticket-role use separate from saved Person roles unless the user explicitly chooses and is authorized to add one.
- Show duplicate warnings before likely duplicate creation.
- Return to the unchanged work order after cancel, validation failure, or save failure.
- Enforce Person-create permission, tenant isolation, validation, focus return, and accessibility.

## Acceptance criteria
- Missing People can be created and selected without leaving or resetting intake.
- Successful save selects the new Person in the correct ticket role.
- Cancel and failure preserve all work-order state.
- Ticket-only role use does not silently modify the Person profile.
- Focused integration and end-to-end tests plus documentation are complete.

## Guardrail
Do not implement technician assignment, scheduling, labor, parts, or broad quick-add infrastructure in this child.
