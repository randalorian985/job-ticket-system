# Slice 007-03: Dispatch Backlog and Board

## Status
Aligned child of Slice 007.

## Goal
Give dispatchers one coherent workspace for existing unscheduled backlog and scheduled work.

## Dependencies
Requires Slices 006-07, 007-01, and 007-02.

## Scope
- Audit current dispatch, backlog, schedule, calendar, assignment, filtering, permission, and navigation behavior.
- Present unscheduled and scheduled work in one coherent dispatcher workflow using existing data.
- Show customer, location, priority, equipment, technician, and schedule context needed for dispatch decisions.
- Open the existing work-order workspace without losing queue context where practical.
- Invoke approved assignment and schedule actions rather than duplicating their business logic.
- Preserve permissions, tenant isolation, timezone behavior, and external calendar integration.
- Follow approved UI workbench direction when available.

## Acceptance criteria
- Dispatchers can move from backlog review to assignment and schedule placement coherently.
- Scheduled, unscheduled, blocked, and conflicting work remain distinguishable and searchable.
- Changes persist to the existing assignment and schedule systems.
- Existing tickets and integrations do not regress.
- Focused tests, wiki, and screenshots are complete.

## Guardrail
Do not create another backlog, assignment, or schedule model; do not include technician execution, labor, parts, invoicing, PWA, or global navigation redesign.
