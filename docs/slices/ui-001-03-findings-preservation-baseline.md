# UI-001-03: Findings and Preservation Baseline

## Status
Planning child of UI-001.

## Goal
Convert current-state evidence into a prioritized usability problem list and explicit non-regression baseline.

## Dependencies
Requires UI-001-01 and UI-001-02.

## Scope
- Consolidate observed findings without inventing wireframe solutions.
- Rank findings by severity, frequency, affected roles, task impact, accessibility impact, and operational risk.
- Identify duplicated entry points, unclear terminology, context-loss patterns, excessive scrolling, inconsistent actions, and responsive failures.
- Document working workflows, route access, permission boundaries, data visibility, and interaction behavior that later designs must preserve.
- Identify open questions requiring stakeholder decisions.

## Required artifacts
- `docs/layout/current-ui-findings.md`
- Prioritized finding register.
- Preservation and non-regression baseline.
- Open-decision register.

## Acceptance criteria
- Every priority finding links to evidence from earlier children.
- Critical preserved behavior is explicit.
- UI-002 through UI-005 have a reviewed baseline for design decisions.

## Guardrail
Do not create production changes or approve a navigation/workspace design in this child.
