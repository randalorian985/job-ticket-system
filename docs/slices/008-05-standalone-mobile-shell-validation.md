# Slice 008-05: Standalone Mobile Shell Validation

## Status
Proposed child of Slice 008.

## Goal
Validate and repair only the shell behavior required for reliable standalone use on supported mobile and tablet devices.

## Dependencies
Requires Slices 008-01 through 008-04 and approved UI-006-03 requirements for any intentional shell change.

## Scope
- Validate standalone launch, viewport, safe areas, orientation, keyboard behavior, touch targets, fixed headers, drawers, dialogs, and navigation recovery.
- Confirm no horizontal page scrolling at supported mobile widths.
- Ensure browser-only controls are not required to return to the main workspace.
- Validate critical work-order, dispatch/queue, and technician routes without redesigning their workflows.
- Confirm desktop manager workflows remain unchanged.
- Document Android, iPhone/iPad home-screen, tablet, and desktop standalone behavior.

## Acceptance criteria
- Supported standalone viewports launch and navigate without clipped critical controls or horizontal page overflow.
- Safe areas and the on-screen keyboard do not obscure required actions.
- Critical routes remain permission-safe and usable.
- Browser and desktop workflows do not regress.
- Responsive validation, accessibility checks, wiki, and screenshots are complete.

## Guardrail
Do not use this child to implement the broad application-shell, work-order workspace, operations-workbench, or technician workflow redesign.
