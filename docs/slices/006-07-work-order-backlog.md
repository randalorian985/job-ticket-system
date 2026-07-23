# Slice 006-07: Work Order Backlog

## Status
Aligned child of Slice 006.

## Goal
Complete the first business tracer by presenting valid unscheduled work orders in one usable backlog.

## Dependencies
Requires Slices 006-01 through 006-06.

## Scope
- Audit the existing job-ticket list, backlog behavior, filters, status rules, permissions, and routes.
- Show valid unscheduled work orders without creating a parallel backlog system.
- Support search, filtering, sorting, and pagination using existing capabilities for ticket number, customer, location, status, priority, requested date, contact, and equipment.
- Open the existing work-order workspace while preserving list context where practical.
- Display enough operational context for managers and dispatchers without exposing restricted data.
- Ensure newly created valid work orders enter the correct backlog state without assignment or scheduling.

## Acceptance criteria
- Organization -> Location -> Equipment -> Work Order -> Backlog works end to end.
- New and existing unscheduled work appears correctly.
- Search, filters, sorting, pagination, and navigation are reliable.
- Permission-specific views do not expose unauthorized data.
- Tests, wiki, and screenshots are complete.

## Guardrail
Do not implement technician assignment, schedule blocks, dispatch-board interaction, quick-create, or broad navigation redesign in this child.
