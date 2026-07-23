# Slice 003-03: Person Quick-Create

## Status
Aligned child of Slice 003.

## Goal
Provide one reusable minimal Person creation capability for authorized calling workflows.

## Dependencies
Requires Slices 003-01 and 003-02.

## Scope
- Reuse canonical Person APIs, validation, tenant isolation, permissions, and duplicate detection.
- Collect only minimum valid Person fields.
- Accept optional Organization and intended-context prefill.
- Allow an explicit optional saved contact role, but never infer or silently add a role from caller use.
- Return a controlled saved, cancelled, or failed result.
- Keep full Person and workforce editing in their owning screens and slices.

## Acceptance criteria
- Authorized callers can create a Person and receive the saved record.
- Duplicate warnings are shown before likely duplicate identity creation.
- Optional role assignment is explicit and permission-safe.
- Cancel and failure do not change the caller.
- Focused tests and documentation cover prefill, validation, permissions, duplicates, and result handling.

## Guardrail
Do not integrate this capability into work-order contacts or other callers in this child.
