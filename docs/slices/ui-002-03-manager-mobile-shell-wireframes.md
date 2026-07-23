# UI-002-03: Manager Mobile Shell Wireframes

## Status
Planning child of UI-002.

## Goal
Wireframe a manager/reviewer mobile shell that uses the approved information architecture without shrinking the desktop rail or relying on a large screen-picker select.

## Dependencies
Requires UI-002-01 and coordinates with UI-002-02.

## Scope
- Create static HTML for mobile primary navigation, current-location context, global utilities, page actions, alerts, and return paths.
- Show role-restricted, deep-linked, long-label, open-navigation, closed-navigation, keyboard, and safe-area states.
- Demonstrate representative queue, record, report, and administration destinations.
- Document touch targets, focus order, scroll behavior, and how browser/standalone contexts differ.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-002/manager-mobile/` plus interaction notes.

## Acceptance criteria
- A manager can identify and reach major task areas without trial-and-error through a select list.
- Location and return paths remain understandable after deep links.
- Navigation does not obscure page actions or create horizontal overflow.
- Touch, focus, safe-area, and restricted states are reviewed.

## Guardrail
Do not redesign technician navigation or wire these artifacts into production.
