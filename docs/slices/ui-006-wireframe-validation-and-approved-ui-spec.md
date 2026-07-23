# UI-006: Wireframe Validation and Approved UI Specification

## Status
Planning. Requires UI-001 through UI-005.

## Goal
Validate the proposed wireframes against real tasks and produce one approved UI specification that can govern later production implementation slices.

## Scope
- Review every wireframe against the current route, role, permission, and workflow inventory.
- Run task-based walkthroughs for manager, dispatcher, reviewer, administrator, and technician roles.
- Record where users hesitate, choose the wrong destination, miss status, lose context, or misunderstand actions.
- Revise wireframes until critical task failures are resolved.
- Define approved navigation, page anatomy, responsive behavior, interaction patterns, terminology, and accessibility expectations.
- Identify reusable production components and migration boundaries without implementing them.
- Divide implementation into small production UI slices with rollback and regression considerations.

## Required validation tasks
- Find and create a work order.
- Reopen and understand an existing work order.
- Assign and schedule a technician.
- Find blocked, overdue, and awaiting-review work.
- Approve or correct time without entering internal IDs.
- Process a parts request.
- Find operational and invoice-ready reporting.
- Find customer, location, person, equipment, and administrative records.
- Technician finds, starts, updates, and submits assigned work.

## Required artifacts
- `docs/layout/approved-ui-specification.md`
- Final static HTML wireframes under `docs/layout/wireframes/approved/`
- Task-validation notes and outcome matrix.
- Approved terminology and navigation map.
- Responsive and accessibility requirements.
- Deferred decisions and rejected alternatives.
- Proposed production UI implementation slice sequence.

## Approval criteria
- All current authorized capabilities have an intentional location.
- Critical tasks can be completed without relying on hidden knowledge of internal IDs or module names.
- Primary actions, status, ownership, and blockers are consistently visible.
- Desktop, tablet, and mobile patterns are coherent but appropriately different.
- No critical unresolved accessibility or permission-visibility issue remains.
- Stakeholders explicitly approve the specification before production redesign starts.

## Guardrail
Approval of wireframes does not authorize one broad UI rewrite. Production work must be divided into small implementation slices with focused tests and migration boundaries.

## Definition of done
An approved UI specification and production slice sequence exist, and broad production redesign remains blocked until that approval is documented.
