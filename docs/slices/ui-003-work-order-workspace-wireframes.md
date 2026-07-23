# UI-003: Work Order Workspace Wireframes

## Status
Planning parent scope only. Requires UI-001 and UI-002.

## Goal
Design intake, detail/edit, and responsive/state behavior as separate reviewable wireframe children.

## Required child sequence
1. [UI-003-01 Work Order Intake Wireframes](ui-003-01-work-order-intake-wireframes.md)
2. [UI-003-02 Work Order Detail and Edit Wireframes](ui-003-02-work-order-detail-edit-wireframes.md)
3. [UI-003-03 Work Order Responsive and State Wireframes](ui-003-03-work-order-responsive-state-wireframes.md)

## Shared decisions
- Preserve existing business rules, fields, routes, permissions, and multi-equipment capability.
- Keep customer, location, equipment, contacts, status, assignment, blockers, and next action understandable.
- Separate viewing from editing and protect unsaved changes.
- Treat quick-add as contextual caller behavior, not a separate workspace.
- Follow approved UI-002 information architecture and page anatomy.

## Parent acceptance criteria
- Intake, detail/edit, tablet/mobile, validation, restricted, historical, and unsaved-change states are reviewed.
- Critical work-order context and primary actions are easy to find.
- The approved work-order workspace is ready for later production implementation slicing.

## Guardrail
Do not send this parent to Codex and do not change production work-order behavior during UI-003 planning.
