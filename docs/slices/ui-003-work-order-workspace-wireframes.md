# UI-003: Work Order Intake and Detail Workspace Wireframes

## Status
Planning. Requires UI-001 and UI-002.

## Goal
Design a clear work-order workspace that supports intake, editing, review, and status understanding without forcing users through long forms, ambiguous tabs, or disconnected screens.

## Scope
- Wireframe new work-order intake.
- Wireframe existing work-order detail and edit states.
- Define summary, customer/location, equipment, contacts, assignment, labor, parts, notes, files, activity, and invoice-readiness placement.
- Distinguish read-only information from editable state.
- Define primary, secondary, destructive, and status-transition actions.
- Define quick-add entry points while preserving unsaved work.
- Define validation, save progress, unsaved changes, empty states, and permission-limited states.
- Support common single-equipment work while preserving multiple-equipment capability.

## Required wireframes
Create static HTML under `docs/layout/wireframes/ui-003/` for:
- Desktop new work order.
- Desktop work-order detail.
- Desktop edit state.
- Tablet work-order workspace.
- Manager mobile work-order view/edit.
- Validation-error and unsaved-change examples.
- Restricted and historical/read-only examples.

## Acceptance criteria
- The next required action is obvious.
- Users can understand customer, location, equipment, contacts, status, assignment, and blockers without scanning the entire page.
- Editing is visibly different from viewing.
- Related information is grouped without hiding critical status.
- Quick-add returns the user to the correct field with prior work preserved.
- Long records remain navigable without excessive back-and-forth scrolling.

## Guardrail
Do not change business rules, field requirements, route structure, or data contracts during wireframing.

## Definition of done
The work-order workspace is approved as the reference design for later scoped implementation slices.
