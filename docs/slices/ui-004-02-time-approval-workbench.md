# UI-004-02: Time Approval Workbench

## Status
Planning child of UI-004.

## Goal
Design a manager time-review workflow based on employees and pending entries rather than internal ID lookup.

## Dependencies
Requires UI-002 and UI-001 time-review findings.

## Scope
- Wireframe employee-oriented and pending-work queues for time approval.
- Show date filtering, employee selection, related work order, submitted time, exceptions, edits, approval, rejection/correction, and audit context.
- Preserve queue context while reviewing an employee or entry.
- Define bulk actions only where current business rules safely support them.
- Show desktop, tablet, mobile urgent-review, empty, loading, error, restricted, and high-volume states.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-004/time-approval/` plus interaction and terminology notes.

## Acceptance criteria
- Managers discover pending time without entering Employee or work-order IDs.
- Employee, date, work-order, duration, exception, and approval state are understandable.
- Editing and approval actions are explicit and auditable.
- Queue context remains visible during review.

## Guardrail
Do not change timekeeping, approval, payroll, billing, or authorization rules and do not design dispatch or parts workflows here.
