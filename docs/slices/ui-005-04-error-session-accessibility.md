# UI-005-04: Error, Session, and Accessibility States

## Status
Planning child of UI-005.

## Goal
Validate the technician mobile concepts across network, session, device, accessibility, and recovery states.

## Dependencies
Requires UI-005-01 through UI-005-03.

## Scope
- Wireframe network loss, slow connection, retry, expired session, reauthentication, stale data, interrupted upload, and partial-save feedback.
- Define what remains viewable versus actionable during failure states without promising unsupported offline editing.
- Validate safe areas, orientation, on-screen keyboard, one-hand use, focus order, screen-reader names, error association, contrast, touch targets, and long-content behavior.
- Confirm account/tenant and permission boundaries remain understandable.
- Record shared resilience patterns for later UI-006 validation.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-005/resilience-accessibility/` plus accessibility and recovery notes.

## Acceptance criteria
- Failure and retry states never imply success incorrectly.
- Session expiration returns the technician to a controlled recovery path.
- Critical controls remain reachable on supported mobile viewports.
- Accessibility and permission-visibility issues are documented before validation begins.

## Guardrail
Do not implement offline synchronization, authentication redesign, or production UI in this child.
