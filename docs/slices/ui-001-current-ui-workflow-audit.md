# UI-001: Current UI and Workflow Audit

## Status
Planning parent scope only.

## Goal
Create an evidence-based current-state baseline through separate inventory, workflow-audit, and findings children.

## Required child sequence
1. [UI-001-01 Route, Role, and Permission Inventory](ui-001-01-route-role-permission-inventory.md)
2. [UI-001-02 Workflow and Usability Audit](ui-001-02-workflow-usability-audit.md)
3. [UI-001-03 Findings and Preservation Baseline](ui-001-03-findings-preservation-baseline.md)

## Shared rules
- Record current facts before proposing solutions.
- Tie every usability finding to a role, task, route, viewport, and observed failure point.
- Identify working patterns and workflows that must not regress.
- Preserve route, permission, and capability facts even when the presentation is poor.

## Parent acceptance criteria
- All routes, roles, permissions, and major actions are inventoried.
- Primary office and technician workflows are traced with screenshots and evidence.
- Findings are prioritized and a preservation baseline is approved.
- UI-002 through UI-005 can design without guessing current behavior.

## Guardrail
Do not send this parent to Codex and do not change production behavior in any UI-001 child.
