# UI-004-03: Parts and Purchasing Workbenches

## Status
Planning child of UI-004.

## Goal
Design coherent parts-request, purchasing, receiving, and approval queue concepts without merging their business rules.

## Dependencies
Requires UI-002 and UI-001 parts/purchasing findings.

## Scope
- Wireframe parts-request review, purchasing queue, receiving/progress context, and parts-approval queue using existing capabilities.
- Show request/work-order/vendor context, ownership, status, aging, exceptions, blockers, quantities, and next actions.
- Preserve queue context with detail panels or split views.
- Distinguish actions and permissions for manager, parts, purchasing, and reviewer roles.
- Show desktop, tablet, mobile urgent-review, empty, loading, error, restricted, and high-volume states.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-004/parts-purchasing/` plus workflow-boundary and terminology notes.

## Acceptance criteria
- Users can distinguish requested, awaiting approval, purchasing, receiving, blocked, and completed work according to current rules.
- Work-order, part, vendor, ownership, quantity, status, and exception context are visible.
- Queue context remains visible during review.
- Related workbenches look coherent without implying one combined data model.

## Guardrail
Do not change purchasing, receiving, parts-approval, inventory, or authorization rules and do not design dispatch or time approval here.
