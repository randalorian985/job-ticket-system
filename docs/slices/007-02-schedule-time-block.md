# Slice 007-02: Schedule Time Block

## Status
Aligned child of Slice 007.

## Goal
Add, change, or remove one scheduled time block for an assigned work order.

## Dependencies
Requires Slice 007-01.

## Scope
- Audit existing schedule, date/time, timezone, assignment, availability, conflict, activity-history, and calendar-integration behavior.
- Add scheduled date, start time, and end time using current conventions.
- Preserve assigned technicians and lead designation.
- Show basic conflict warnings using existing schedule and availability data.
- Support rescheduling and unscheduling without deleting work orders or assignment history.
- Preserve timezone handling and existing external calendar integrations.
- Record saved schedule changes in activity history.

## Acceptance criteria
- An assigned work order can be scheduled into a valid time block.
- Reschedule and unschedule behavior persists correctly.
- Basic conflicts are visible without silently blocking authorized overrides unless existing policy requires it.
- Existing calendar integrations and historical schedule data do not regress.
- Focused tests and wiki documentation are complete.

## Guardrail
Do not build the dispatch board, technician queue, recurring-schedule redesign, or broad application-shell changes in this child.
