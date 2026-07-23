# UI-006-03: Approved UI Specification and Production Plan

## Status
Planning child of UI-006 and final UI approval gate.

## Goal
Publish the approved UI specification and divide production implementation into focused, reversible slices.

## Dependencies
Requires approved UI-006-01 and UI-006-02 results with critical blockers resolved or explicitly accepted.

## Scope
- Consolidate final navigation, route placement, page anatomy, work-order workspace, workbench, technician-mobile, responsive, terminology, interaction, and accessibility decisions.
- Publish final approved static wireframes.
- Record rejected alternatives, deferred decisions, exceptions, and preservation requirements.
- Identify reusable production components and domain-specific implementations.
- Define a production UI slice sequence where every child has one coherent outcome, focused tests, migration/compatibility boundaries, screenshots, and rollback considerations.
- Obtain explicit stakeholder approval.

## Required artifacts
- `docs/layout/approved-ui-specification.md`
- Final static HTML under `docs/layout/wireframes/approved/`
- Approved terminology and navigation map.
- Responsive and accessibility requirements.
- Decision, exception, and deferral record.
- Right-sized production UI implementation sequence.

## Approval criteria
- Every authorized capability has an intentional location.
- Critical tasks pass validation for office and technician roles.
- No critical unresolved accessibility or permission-visibility issue remains.
- Stakeholder approval is recorded.
- Production work is divided into small slices; no broad rewrite is authorized.

## Guardrail
Do not implement production UI in this child. Approval governs later implementation but does not replace child-level audit, testing, or rollback planning.
