# Slice 007-02: Schedule Time Block

## Status
Aligned with Kevin; child slice of Slice 007.

## Goal
Add a scheduled date and time block to an assigned work order.

## Dependencies
Requires Slice 007-01.

## Scope
- Audit existing schedule, calendar, assignment, date/time, recurrence, and timezone behavior.
- Add scheduled date, start time, and end time to an assigned work order.
- Preserve one or more assigned technicians and the lead technician where supported.
- Provide basic conflict warnings using existing availability and schedule data.
- Support rescheduling and unscheduling without deleting the work order or technician history.
- Preserve timezone handling and existing external calendar integrations.
- Record schedule changes in activity history.

## Acceptance criteria
- An assigned work order can be scheduled into a valid time block.
- Reschedule and unschedule behavior persists correctly.
- Basic conflicts are visible without silently blocking authorized overrides unless existing policy requires it.
- Existing calendar integrations and historical schedule data do not regress.
- Tests and wiki documentation are updated.

## Guardrail
Do not build the full dispatch board, technician work queue, recurring scheduling redesign, or broad application-shell changes in this slice.