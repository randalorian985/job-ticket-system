# Slice 007: Assignment, Scheduling, and Dispatch

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Complete Backlog Work Order -> Technician Assignment -> Schedule Block -> Technician Queue through four focused children.

## Dependencies
Requires Slice 006-07 and completed applicable Slice 005 children, including 005-04 workforce eligibility.

## Required child sequence
1. [007-01 Technician Assignment](007-01-technician-assignment.md)
2. [007-02 Schedule Time Block](007-02-schedule-time-block.md)
3. [007-03 Dispatch Backlog and Board](007-03-dispatch-backlog-and-board.md)
4. [007-04 Technician Work Queue](007-04-technician-work-queue.md)

## Shared decisions
- Technicians are eligible People with workforce profiles.
- Assignment and scheduling are separate capabilities.
- Dispatch reuses backlog, assignment, and schedule data.
- Technician views preserve assigned-ticket restrictions and hide manager-only data.
- Existing calendar integrations and timezone behavior must remain correct.

## UI steering
Narrow assignment, scheduling, dispatch, and queue UI changes may be made by their owning child. Broad operations-workbench and technician-mobile redesign remains governed by UI-004 through UI-006.

## Parent acceptance criteria
- All four children are complete.
- Backlog -> Assignment -> Schedule -> Technician Queue works end to end.
- Existing assignments, schedules, tickets, and integrations remain intact.
- Tenant isolation, permissions, tests, wiki, and screenshots are correct.

## Guardrail
Do not send this parent to Codex. Do not include a separate workforce identity system, PWA implementation, technician execution, labor, parts, or completion work.
