# UI-001: Current UI and Workflow Audit

## Status
Planning.

## Goal
Document where users become confused, how current routes and screens support real tasks, and which patterns should be preserved, repaired, consolidated, or replaced.

## Scope
- Inventory all manager, dispatcher, reviewer, administrator, and technician routes.
- Map primary tasks across dashboard, work orders, scheduling, approvals, parts, reports, master data, administration, and technician work.
- Review current navigation labels, grouping, page headers, actions, filters, forms, tables, tabs, dialogs, drawers, empty states, errors, and mobile behavior.
- Identify duplicated entry points, unclear labels, hidden actions, excessive scrolling, context loss, and inconsistent interaction patterns.
- Capture screenshots at representative desktop, tablet, and mobile widths.
- Record role and permission visibility for each route and major action.
- Identify workflows that currently work well and must not regress.

## Required artifacts
- `docs/layout/current-state-route-map.md`
- `docs/layout/current-state-workflow-map.md`
- `docs/layout/current-ui-findings.md`
- Screenshot inventory with route, role, viewport, and finding references.
- Prioritized usability problem list with severity and affected roles.

## Validation scenarios
At minimum, trace:
- Create and reopen a work order.
- Find and edit a customer, location, person, and equipment unit.
- Assign and schedule a technician.
- Review time and parts requests.
- Find invoice-ready or operational reports.
- Technician finds assigned work and records progress.
- Administrator finds configuration and user management.

## Guardrails
- Do not change production behavior.
- Separate observed problems from proposed solutions.
- Do not mark a screen confusing without identifying the task, evidence, and failure point.
- Preserve route and permission facts even when the current presentation is poor.

## Definition of done
The audit provides enough evidence to design information architecture and wireframes without guessing which users, tasks, routes, or capabilities exist.
