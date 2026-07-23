# UI-002: Information Architecture and Application Shell

## Status
Planning parent scope only. Requires UI-001.

## Goal
Define task-oriented information architecture and responsive shell concepts through separate planning children.

## Required child sequence
1. [UI-002-01 Information Architecture](ui-002-01-information-architecture.md)
2. [UI-002-02 Desktop and Tablet Shell Wireframes](ui-002-02-desktop-tablet-shell-wireframes.md)
3. [UI-002-03 Manager Mobile Shell Wireframes](ui-002-03-manager-mobile-shell-wireframes.md)

## Shared decisions
- Primary navigation is organized around user tasks and operational domains.
- Desktop uses scalable navigation without horizontal primary-nav scrolling.
- Global utilities remain distinct from page-specific actions.
- Current authorized routes remain intentionally reachable.
- Shell concepts establish shared page anatomy for downstream wireframes.

## Parent acceptance criteria
- Navigation groups, labels, route placement, page anatomy, and responsive shell behavior are reviewed.
- Desktop, tablet, and manager-mobile shell artifacts use one information architecture.
- Keyboard, focus, touch, restricted, collapsed, and deep-link states are documented.

## Guardrail
Do not send this parent to Codex and do not wire any UI-002 artifact into the production router or shell.
