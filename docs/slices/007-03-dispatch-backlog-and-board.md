# Slice 007-03: Dispatch Backlog and Board

## Status
Aligned with Kevin; child slice of Slice 007.

## Goal
Give dispatchers one usable workspace for unscheduled backlog work and scheduled work orders.

## Dependencies
Requires Slices 006-04, 007-01, and 007-02.

## Scope
- Audit the current dispatch, calendar, backlog, filtering, assignment, and schedule UI before changing it.
- Present unscheduled work orders and scheduled work in one coherent dispatcher workflow.
- Show enough customer, location, priority, equipment, technician, and schedule context to make dispatch decisions.
- Support opening the existing work-order workspace from either backlog or schedule views.
- Support assignment and rescheduling through the existing approved actions.
- Preserve manager/dispatcher permissions, tenant isolation, and external calendar behavior.
- Keep the layout focused on function first and compatible with the separately approved application-shell direction.

## Acceptance criteria
- Dispatchers can move from backlog review to technician assignment and schedule placement without losing context.
- Scheduled and unscheduled work remain distinguishable and searchable.
- Changes persist and appear to the correct users.
- The screen does not create a second backlog, assignment, or schedule system.
- Existing integrations and tickets do not regress.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not perform the broad global navigation redesign, PWA work, technician execution workflow, labor tracking, parts workflow, or invoice preparation in this slice.