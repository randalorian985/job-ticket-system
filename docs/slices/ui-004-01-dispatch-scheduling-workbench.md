# UI-004-01: Dispatch and Scheduling Workbench

## Status
Planning child of UI-004.

## Goal
Design one coherent dispatcher workspace for unscheduled backlog, technician assignment, schedule placement, conflicts, and work-order context.

## Dependencies
Requires UI-002 and coordinates with UI-003.

## Scope
- Wireframe backlog with selected work-order detail.
- Wireframe day/week scheduling with unscheduled queue.
- Show technician assignment, schedule edit, conflict, blocked, overdue, and unassigned states.
- Preserve queue context while opening details or approved assignment/schedule actions.
- Define desktop and tablet density, filters, grouping, ownership, and schedule context.
- Show mobile urgent-review behavior without duplicating the full board.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-004/dispatch-scheduling/` plus interaction notes.

## Acceptance criteria
- Dispatchers can distinguish unscheduled, unassigned, scheduled, blocked, overdue, and conflicting work.
- Customer, location, equipment, priority, technicians, and schedule context are visible for decisions.
- Queue context remains visible while reviewing or editing.
- No concept requires a parallel backlog, assignment, or schedule model.

## Guardrail
Do not design time approval, parts/purchasing, technician execution, or change production scheduling rules in this child.
