# Slice 004-03: Customer Equipment Quick-Create

## Status
Aligned child of Slice 004.

## Goal
Provide one reusable minimal physical Customer Equipment creation capability for a selected customer and Service Location.

## Dependencies
Requires Slices 004-01 and 004-02.

## Scope
- Reuse canonical Customer Equipment APIs, validation, permissions, and duplicate serial/asset warnings.
- Require customer Organization and Service Location context before opening.
- Prefill and clearly display customer and location.
- Collect only minimum valid physical-equipment fields.
- Allow selection of an existing Equipment Type; do not create a broad nested type-management workflow.
- Return a controlled saved, cancelled, or failed result.
- Keep full editing in Customer Equipment management.

## Acceptance criteria
- Authorized callers can create physical equipment for the selected customer/location and receive the saved record.
- Cross-tenant or mismatched context is rejected.
- Duplicate warnings and validation match direct creation.
- Cancel and failure do not change the caller.
- Focused tests and documentation are complete.

## Guardrail
Do not integrate this capability into work-order intake in this child.
