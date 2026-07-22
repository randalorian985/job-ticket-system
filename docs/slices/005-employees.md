# Slice 005: Employees

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Provide a dependable employee/technician directory needed for assignment and scheduling.

## Dependencies
Requires the aligned master-data foundation.

## Scope
- Audit existing users, employees, technicians, roles, and assignment data.
- Reuse identity records and avoid creating a second employee identity system.
- List, view, edit, activate, and deactivate employees as permitted.
- Maintain role, technician eligibility, contact information, and scheduling visibility using existing authorization conventions.
- Preserve assigned-ticket restrictions and current login behavior.

## Acceptance criteria
- Eligible employees can be selected by later assignment and scheduling workflows.
- Deactivation does not corrupt historical assignments.
- Identity, tenant isolation, permissions, tests, and wiki documentation remain correct.

## Guardrail
Do not implement work-order assignment or the scheduling board in this slice.