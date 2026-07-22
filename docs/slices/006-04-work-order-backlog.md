# Slice 006-04: Work Order Backlog

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Complete the first business tracer by turning saved work orders into a usable unscheduled backlog.

## Dependencies
Requires Slices 006-01 through 006-03.

## Scope
- Audit the existing job-ticket list, backlog, filters, status rules, permissions, and routes.
- Show valid unscheduled work orders in a clear backlog view.
- Support search and filtering by ticket number, customer organization, service location, status, priority, requested date, contact, and equipment where supported.
- Open the existing work-order workspace from the backlog.
- Display enough context for managers and dispatchers to understand the work without exposing restricted billing data to technicians.
- Preserve pagination, sorting, tenant isolation, and existing ticket visibility rules.
- Ensure newly created work orders enter the appropriate backlog state without requiring scheduling.

## Acceptance criteria
- Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog works end to end.
- New and existing unscheduled work orders appear correctly.
- Search, filters, sorting, and navigation are reliable.
- Permission-specific views do not expose unauthorized data.
- Existing tickets continue to load and no parallel backlog is created.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not implement technician assignment, schedule blocks, dispatch drag-and-drop, broad navigation redesign, or quick-add in this slice.