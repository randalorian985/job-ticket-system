# UI-004-04: Shared Queue Patterns

## Status
Planning child of UI-004.

## Goal
Define shared operational queue patterns only after dispatch, time approval, and parts/purchasing needs are understood.

## Dependencies
Requires UI-004-01 through UI-004-03.

## Scope
- Compare queue filters, sorting, grouping, search, status, ownership, aging, exceptions, bulk selection, detail panels, density, pagination, loading, empty, error, restricted, and high-volume states.
- Standardize equivalent patterns while preserving domain-specific terminology, actions, permissions, and data.
- Define desktop, tablet, and mobile urgent-review adaptations.
- Document reusable component candidates without implementing them.
- Record intentional differences and rejected forced-uniformity proposals.

## Required artifacts
- Shared queue-pattern specification.
- Static comparison examples under `docs/layout/wireframes/ui-004/shared-patterns/`.
- Reusable-component candidate and exception matrix.

## Acceptance criteria
- Equivalent queue behaviors use consistent concepts.
- Domain-specific rules and actions remain explicit.
- Shared patterns support accessibility and operational density.
- Later production implementation can separate shared components from domain workbenches.

## Guardrail
Do not change production UI or business rules and do not force workflows into one generic queue model.
