# UI-004: Dispatch, Scheduling, and Review Workbench Wireframes

## Status
Planning. Requires UI-001 and UI-002. Coordinate with the approved direction of UI-003.

## Goal
Design task-focused workbenches for dispatching, scheduling, approvals, purchasing, and operational review so users can see queues, priorities, ownership, exceptions, and next actions in one coherent workspace.

## Scope
- Wireframe dispatch backlog and scheduling board relationships.
- Wireframe technician assignment and schedule editing.
- Wireframe time approval using employee and work queues rather than requiring users to know internal IDs.
- Wireframe parts requests, purchasing, and parts approval queues.
- Define shared queue patterns for filters, sorting, grouping, bulk selection, status, ownership, aging, and exceptions.
- Define detail-panel or split-view behavior that preserves queue context.
- Define desktop and tablet density without oversized cards or horizontal page navigation.
- Define mobile manager/reviewer behavior for urgent review actions.

## Required wireframes
Create static HTML under `docs/layout/wireframes/ui-004/` for:
- Dispatch backlog with selected work-order detail.
- Day or week scheduling board with unscheduled queue.
- Technician assignment and conflict example.
- Time approval queue grouped by employee and work order.
- Parts request and purchasing queue.
- Tablet workbench.
- Mobile urgent-review example.
- Empty, loading, error, restricted, and high-volume states.

## Acceptance criteria
- Users can distinguish unassigned, unscheduled, blocked, overdue, awaiting review, and completed work.
- Queue context remains visible while reviewing or editing an item.
- Users are not required to enter employee IDs or work-order IDs to discover pending work.
- Filters and bulk actions are consistent across workbenches where behavior is equivalent.
- Scheduling conflicts and blockers are visible without opening several pages.
- Workbench density supports operational processing without sacrificing accessibility.

## Guardrail
Do not change scheduling, approval, purchasing, or authorization rules during wireframing.

## Definition of done
The operational workbench patterns are approved and can be divided into scoped production implementation slices without inventing a separate UI model for every queue.
