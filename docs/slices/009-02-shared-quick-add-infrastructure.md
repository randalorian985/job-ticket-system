# Slice 009-02: Shared Quick-Add Infrastructure

## Status
Proposed child of Slice 009.

## Goal
Consolidate only the quick-add lifecycle infrastructure proven equivalent by Slice 009-01.

## Dependencies
Requires approved Slice 009-01 findings.

## Scope
- Implement the approved shared result contract, lifecycle helpers, dialog/drawer primitives, caller-state protection, focus return, and common validation/error presentation where behavior is equivalent.
- Preserve owned master-data APIs, field requirements, duplicate logic, permissions, and tenant checks.
- Preserve caller-specific contextual prefill and automatic-selection behavior.
- Remove duplicate infrastructure only after focused regression tests prove equivalence.
- Follow approved UI-006-03 interaction and accessibility rules where available.

## Acceptance criteria
- Supported flows use shared infrastructure only where the audit approved consolidation.
- Caller-specific context and owned business rules remain intact.
- Save, cancel, failure, result, and focus behavior are consistent.
- Existing master-data and work-order behavior does not regress.
- Focused component, integration, and end-to-end tests plus documentation are complete.

## Guardrail
Do not rebuild master-data forms, introduce a new workflow framework, broaden permissions, or redesign work-order intake in this child.
