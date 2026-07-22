# Slice 007: Basic Scheduling Board

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Turn backlog work orders into visible schedule blocks assigned to technicians and times.

## Dependencies
Requires Slices 005 and 006.

## Scope
- Show unscheduled backlog work orders.
- Assign one or more technicians, a lead technician when supported, start/end time, and date.
- Display resulting schedule blocks in the existing scheduling experience.
- Preserve assignment permissions and technician visibility rules.
- Audit current calendar, assignment, and dispatch behavior before changing code.

## Acceptance criteria
- Backlog Work Order -> Technician and Time Assignment -> Schedule Block works end to end.
- Schedule changes persist and remain visible to the correct users.
- Existing assignments and calendar integrations do not regress.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not perform the broad application-shell redesign in this slice.