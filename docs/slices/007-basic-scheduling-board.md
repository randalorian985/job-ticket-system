# Slice 007: Basic Scheduling Board

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Turn backlog work orders into visible schedule blocks assigned to eligible technician People and times.

## Dependencies
Requires Slices 005 and 006.

Slice 005 provides workforce access, technician eligibility, and availability using the Person identity from Slice 003. Scheduling must not introduce a separate employee or technician identity model.

## Scope
- Show unscheduled backlog work orders.
- Assign one or more eligible technician People, a lead technician when supported, start/end time, and date.
- Display resulting schedule blocks in the existing scheduling experience.
- Respect workforce active status, technician eligibility, and available scheduling data.
- Preserve assignment permissions and technician visibility rules.
- Audit current calendar, assignment, and dispatch behavior before changing code.

## Acceptance criteria
- Backlog Work Order -> Technician and Time Assignment -> Schedule Block works end to end.
- Only eligible technician People can receive new assignments.
- Schedule changes persist and remain visible to the correct users.
- Existing assignments and calendar integrations do not regress.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not create separate Employee or Technician records, and do not perform the broad application-shell redesign in this slice.