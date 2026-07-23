# UI-005-02: Active Work and Time Capture

## Status
Planning child of UI-005.

## Goal
Design clear active-job and time-state behavior using existing timekeeping rules.

## Dependencies
Requires UI-005-01.

## Scope
- Wireframe start/clock-in, active, pause, resume, clock-out, and correction-feedback states supported by current rules.
- Keep current job, elapsed/current time state, schedule context, and primary action clear.
- Define prevention or explanation of invalid transitions and active-ticket lockout behavior where applicable.
- Show save progress, confirmation, failure, retry, stale state, and interrupted-session recovery concepts.
- Define one-hand use, touch targets, focus order, keyboard behavior, safe areas, and minimal-scroll action placement.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-005/active-time/` plus state-transition notes.

## Acceptance criteria
- The technician always understands whether work is not started, active, paused, or stopped.
- The next valid time action is obvious.
- Failure states never imply time was recorded when it was not.
- Existing timekeeping and permission rules remain unchanged.

## Guardrail
Do not design notes, parts, photos, blockers, completion, payroll, or offline synchronization in this child.
