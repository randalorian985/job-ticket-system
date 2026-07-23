# UI-002-02: Desktop and Tablet Shell Wireframes

## Status
Planning child of UI-002.

## Goal
Wireframe expanded/collapsed desktop and tablet application shells using the approved information architecture.

## Dependencies
Requires UI-002-01.

## Scope
- Create static HTML for desktop expanded navigation, desktop collapsed navigation, and tablet behavior.
- Show global utility bar, route title, location context, local navigation, primary action, alerts, and work-area placement.
- Show active, hover, focus, disabled, restricted, collapsed, high-content, and deep-linked states.
- Document collapse persistence, responsive breakpoints, keyboard behavior, and touch behavior.
- Demonstrate representative operational and administration pages without redesigning their internal workflows.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-002/desktop-tablet/` plus interaction notes.

## Acceptance criteria
- Primary navigation does not horizontally scroll.
- The work area begins substantially higher than in the current shell.
- Current authorized routes remain reachable.
- Expanded, collapsed, tablet, keyboard, focus, and restricted states are reviewed.

## Guardrail
Do not include manager-mobile shell design or wire these artifacts into production.
