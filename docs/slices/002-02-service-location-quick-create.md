# Slice 002-02: Service Location Quick-Create

## Status
Aligned child of Slice 002.

## Goal
Provide one reusable minimal Service Location creation capability for an already selected customer Organization.

## Dependencies
Requires Slice 002-01.

## Scope
- Reuse canonical location APIs, validation, permissions, and duplicate/address warnings.
- Require customer context before opening.
- Prefill and clearly display the selected customer.
- Collect only minimum valid location fields.
- Return a controlled saved, cancelled, or failed result.
- Keep full editing in Service Location management.

## Acceptance criteria
- Authorized callers can create a location for the selected customer and receive the saved record.
- Cross-tenant customer context is rejected.
- Cancel and failure do not change the caller.
- Tests and documentation cover prefill, permission, validation, duplicates, and result handling.

## Guardrail
Do not integrate this capability into work orders or equipment workflows in this child.
