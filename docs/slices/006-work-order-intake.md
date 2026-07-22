# Slice 006: Work Order Intake and Backlog

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Complete the first business tracer through small, reviewable slices:

Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog

## Dependencies
Requires Slices 001 through 004 and the applicable completed Slice 005 identity/workforce child slices.

## Required child sequence
1. [006-01 Work Order Core](006-01-work-order-core.md)
2. [006-02 Work Order Equipment](006-02-work-order-equipment.md)
3. [006-03 Work Order Contacts](006-03-work-order-contacts.md)
4. [006-04 Work Order Backlog](006-04-work-order-backlog.md)

Each child slice must be implemented, validated, documented, and reviewed before the next child begins unless a documented blocker requires otherwise.

## Shared decisions
- Reuse and repair the existing job-ticket/work-order system; do not create a parallel work-order module.
- A work order requires a customer organization.
- A work order may include one or more equipment units.
- The common one-equipment workflow should remain simple.
- Service and billing contacts use centralized People.
- The same Person may serve multiple ticket-specific roles.
- Saved Person roles rank suggestions but do not improperly restrict selection.
- A valid work order can enter backlog without being assigned or scheduled.
- Existing tickets and history must remain usable.

## Parent acceptance criteria
- All four child slices are complete.
- Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog works end to end.
- Existing work orders continue to load and retain their relationships.
- Tenant isolation, permissions, activity history, tests, wiki, and screenshots are correct.

## Guardrail
Do not send this parent scope to Codex as one implementation task. Do not implement technician assignment, scheduling, dispatch-board behavior, PWA work, or broad quick-add behavior here.