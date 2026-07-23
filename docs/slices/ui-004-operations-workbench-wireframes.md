# UI-004: Operations Workbench Wireframes

## Status
Planning parent scope only. Requires UI-001 and UI-002 and coordinates with UI-003.

## Goal
Design dispatch/scheduling, time approval, parts/purchasing, and shared queue patterns as separate planning children.

## Required child sequence
1. [UI-004-01 Dispatch and Scheduling Workbench](ui-004-01-dispatch-scheduling-workbench.md)
2. [UI-004-02 Time Approval Workbench](ui-004-02-time-approval-workbench.md)
3. [UI-004-03 Parts and Purchasing Workbenches](ui-004-03-parts-purchasing-workbenches.md)
4. [UI-004-04 Shared Queue Patterns](ui-004-04-shared-queue-patterns.md)

## Shared decisions
- Each workbench centers on queues, priorities, ownership, exceptions, and next actions.
- Queue context remains visible while an item is reviewed or edited.
- Users are not required to know internal IDs to discover pending work.
- Similar filters, sorting, grouping, bulk actions, density, and states use shared patterns only after workflow-specific wireframes are understood.
- Existing scheduling, approval, purchasing, authorization, and data rules remain unchanged.

## Parent acceptance criteria
- Each operational domain has reviewed desktop, tablet, mobile-urgent, empty, error, restricted, and high-volume concepts where applicable.
- Shared patterns are based on proven equivalent needs rather than forced uniformity.
- Production implementation can be divided by workbench and shared component boundaries.

## Guardrail
Do not send this parent to Codex and do not change production operations behavior during UI-004 planning.
