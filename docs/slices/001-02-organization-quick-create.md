# Slice 001-02: Organization Quick-Create

## Status
Aligned child of Slice 001.

## Goal
Provide one reusable minimal Organization creation capability for authorized calling workflows.

## Dependencies
Requires Slice 001-01.

## Scope
- Audit existing inline, dialog, drawer, or modal Organization creation behavior.
- Reuse the canonical Organization API, validation, role model, and duplicate detection.
- Collect only the minimum valid fields for the selected Organization role.
- Accept contextual prefill and return a controlled saved, cancelled, or failed result.
- Enforce create permission and tenant isolation.
- Keep full editing in the Organization management workflow.

## Acceptance criteria
- Authorized callers can launch the reusable flow and receive the saved Organization.
- Duplicate warnings and role validation match direct Organization creation.
- Cancel and failed save return controlled results without changing the caller.
- The capability has focused component/API tests and documentation.

## Guardrail
Do not integrate this flow into work-order intake or other callers in this child; integration belongs to the applicable workflow slice.
