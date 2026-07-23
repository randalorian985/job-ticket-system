# UI-002-01: Information Architecture

## Status
Planning child of UI-002.

## Goal
Define task-oriented navigation groups, labels, route placement, and shared page anatomy before drawing responsive shells.

## Dependencies
Requires completed UI-001.

## Scope
- Propose first-level navigation groups and labels for manager, dispatcher, reviewer, and administrator roles.
- Assign current routes to primary navigation, local navigation, global utilities, contextual actions, or deliberate deep-link-only locations.
- Define route title, breadcrumb/location context, local navigation, primary action, utility, notification, and search placement.
- Define role-restricted visibility without removing authorized capabilities.
- Compare alternatives against UI-001 tasks and findings.

## Required artifacts
- `docs/layout/proposed-information-architecture.md`
- Proposed navigation and route-placement map.
- Page-anatomy specification.
- Alternatives and decision record.

## Acceptance criteria
- Users can identify where to create work, dispatch, review, manage records, report, and administer without module-name guesswork.
- Every current authorized route has an intentional location.
- The architecture is reviewed before responsive shell wireframing begins.

## Guardrail
Do not create shell HTML or change production navigation in this child.
