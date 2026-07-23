# Slice 007: Assignment, Scheduling, and Dispatch

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Steering inheritance
This parent and all Slice 007 children inherit [Shared Slice Steering](STEERING.md). Each Codex run must target one child slice only and must read the master plan, shared steering, this parent scope, the target child, and any approved UI specification before changing code.

## Goal
Complete the second business tracer through small, reviewable slices:

Backlog Work Order -> Eligible Technician Person and Time Assignment -> Schedule Block

## Dependencies
Requires Slice 006 and the applicable completed Slice 005 identity, authorization, workforce, and migration child slices.

## Required child sequence
1. [007-01 Technician Assignment](007-01-technician-assignment.md)
2. [007-02 Schedule Time Block](007-02-schedule-time-block.md)
3. [007-03 Dispatch Backlog and Board](007-03-dispatch-backlog-and-board.md)
4. [007-04 Technician Work Queue](007-04-technician-work-queue.md)

Each child slice must be implemented, validated, documented, and reviewed before the next child begins unless a documented blocker requires otherwise.

## Shared decisions
- Technicians are eligible People with workforce profiles, not separate Employee or Technician identity records.
- One or more technicians may be assigned to a work order.
- A lead technician may be identified where supported.
- Assignment can exist before a scheduled time block.
- Scheduling must preserve timezone behavior and existing calendar integrations.
- Dispatch should use the existing backlog, assignments, and schedule data rather than creating parallel systems.
- Technician views must preserve assigned-ticket restrictions and hide manager-only or billing data.

## UI steering
- Slice 007 may add or repair narrowly scoped assignment, scheduling, backlog, dispatch, and technician-queue interfaces required by its child slices.
- Before UI-006 approval, preserve the current shell and broad workbench structure; do not establish a competing operations redesign.
- Record confusing queue grouping, filters, assignment controls, schedule editing, review transitions, terminology, or mobile technician access as input to UI-004, UI-005, and UI-006.
- After UI-006 approval, production operations and technician-queue UI must conform to the approved workbench, navigation, terminology, responsive rules, accessibility requirements, and interaction patterns.
- No UI decision may weaken technician visibility restrictions, manager-only data boundaries, tenant isolation, or auditability.

## Parent acceptance criteria
- All four child slices are complete.
- Backlog -> Technician Assignment -> Time Assignment -> Schedule Block works end to end.
- Dispatchers can manage unscheduled and scheduled work coherently.
- Technicians have a focused, permission-safe queue.
- Existing assignments, schedules, tickets, and integrations remain intact.
- Tenant isolation, permissions, tests, wiki, and screenshots are correct.

## Guardrail
Do not send this parent scope to Codex as one implementation task. Do not introduce a separate employee identity system or perform the broad application-shell, operations-workbench, PWA, technician execution, labor, parts, or completion redesign here.
