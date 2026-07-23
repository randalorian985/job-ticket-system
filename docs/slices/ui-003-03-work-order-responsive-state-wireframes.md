# UI-003-03: Work Order Responsive and State Wireframes

## Status
Planning child of UI-003.

## Goal
Validate the approved intake and detail concepts across tablet, manager-mobile, restricted, historical, empty, loading, and failure states.

## Dependencies
Requires UI-003-01 and UI-003-02.

## Scope
- Create tablet and manager-mobile work-order intake/view/edit wireframes.
- Show loading, empty, validation, save failure, retry, stale data, unsaved changes, restricted, historical/read-only, and high-content states.
- Validate long equipment, contact, part, note, file, and activity content.
- Document responsive section order, sticky actions, drawers/dialogs, keyboard behavior, focus order, safe areas, and touch targets.
- Preserve the approved desktop information hierarchy without merely shrinking it.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-003/responsive-states/` plus responsive and accessibility notes.

## Acceptance criteria
- Critical status, context, and primary actions remain reachable at supported widths.
- No required workflow depends on horizontal page scrolling.
- Error and retry states never imply data was saved when it was not.
- Restricted and historical states remain understandable and permission-safe.

## Guardrail
Do not change production behavior or expand into technician execution, dispatch, parts, or invoice workflow redesign.
