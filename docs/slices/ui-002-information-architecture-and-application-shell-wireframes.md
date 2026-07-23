# UI-002: Information Architecture and Application Shell Wireframes

## Status
Planning. Requires UI-001 findings.

## Goal
Define a scalable application structure that lets each role find its work quickly without relying on a crowded top navigation or knowledge of internal feature groupings.

## Scope
- Propose task-oriented navigation labels and grouping for manager, dispatcher, reviewer, and administrator roles.
- Define desktop expanded and collapsed left navigation.
- Define compact global utility bar content.
- Define route title, breadcrumb, local navigation, primary-action, and notification placement.
- Define tablet navigation behavior.
- Define manager mobile navigation behavior without using a large screen-picker select as the primary pattern.
- Show active, hover, focus, disabled, restricted, and collapsed states.
- Preserve access to every current authorized route.

## Required wireframes
Create static HTML under `docs/layout/wireframes/ui-002/` for:
- Desktop expanded shell.
- Desktop collapsed shell.
- Tablet shell.
- Manager mobile shell.
- Role-restricted navigation example.
- Deep-linked page with clear location and return path.

## Required decisions
- Final first-level navigation groups and labels.
- Which destinations belong in primary navigation, local navigation, utilities, or contextual actions.
- Navigation collapse persistence and responsive breakpoints.
- Global versus page-specific search and actions.
- Page anatomy shared by operational screens.

## Acceptance criteria
- A user can identify where to create work, dispatch work, review work, manage records, run reports, and administer the system without opening multiple menus by trial and error.
- Current authorized routes remain reachable.
- Navigation does not horizontally scroll.
- The work area begins substantially higher than in the current shell.
- Keyboard and touch behavior are documented.

## Guardrail
Do not wire these artifacts into the production router or shell.

## Definition of done
The application shell and information architecture are reviewed and stable enough for downstream workspace wireframes to use consistently.
