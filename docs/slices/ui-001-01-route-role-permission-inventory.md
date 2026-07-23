# UI-001-01: Route, Role, and Permission Inventory

## Status
Planning child of UI-001.

## Goal
Create a factual inventory of routes, roles, permissions, navigation entry points, and major actions.

## Scope
- Inventory manager, dispatcher, reviewer, administrator, and technician routes.
- Record route titles, current navigation location, allowed roles, server-side protections, frontend guards, major actions, and linked workflows.
- Identify redirects, hidden/deferred routes, duplicate entry points, and deep-link behavior.
- Capture representative desktop, tablet, and mobile screenshots for navigation and route context.

## Required artifacts
- `docs/layout/current-state-route-map.md`
- `docs/layout/current-state-role-permission-matrix.md`
- Route and navigation screenshot index.

## Acceptance criteria
- Every current authorized route and major action has an intentional inventory entry.
- Frontend visibility and server-side authority are distinguished.
- Facts are recorded without proposing the redesign.

## Guardrail
Do not change production behavior or combine workflow usability conclusions into this child.
