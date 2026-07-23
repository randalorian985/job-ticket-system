# Slice 006: Work Order Intake and Backlog

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Complete Organization -> Service Location -> Customer Equipment -> Work Order -> Backlog through independently reviewable children.

## Dependencies
Requires completed applicable children from Slices 001 through 005.

## Required child sequence
1. [006-01 Work Order Core](006-01-work-order-core.md)
2. [006-02 Organization and Location Quick-Create Integration](006-02-organization-location-quick-create-integration.md)
3. [006-03 Work Order Equipment Assignment](006-03-work-order-equipment-assignment.md)
4. [006-04 Equipment Quick-Create Integration](006-04-equipment-quick-create-integration.md)
5. [006-05 Work Order Contact Assignment](006-05-work-order-contact-assignment.md)
6. [006-06 Person Quick-Create Integration](006-06-person-quick-create-integration.md)
7. [006-07 Work Order Backlog](006-07-work-order-backlog.md)

## Shared decisions
- Reuse and repair the existing job-ticket/work-order system.
- Core work-order persistence is separate from reusable-record quick-create integration.
- A work order may include one or more Customer Equipment units.
- Service and billing contacts use canonical People.
- A valid work order can enter backlog without assignment or scheduling.
- Existing tickets and history remain usable.

## UI steering
Narrow intake and selector changes may be made by the owning child. Broad work-order workspace redesign remains governed by UI-003 and UI-006.

## Parent acceptance criteria
- All seven children are complete.
- The full first tracer works end to end.
- Existing work orders retain relationships and history.
- Tenant isolation, permissions, activity history, tests, wiki, and screenshots are correct.

## Guardrail
Do not send this parent to Codex. Do not implement technician assignment, scheduling, dispatch, PWA, or broad work-order workspace redesign.
