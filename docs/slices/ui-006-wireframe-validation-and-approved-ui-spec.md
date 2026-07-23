# UI-006: Validation and Approved UI Specification

## Status
Planning parent scope only. Requires UI-001 through UI-005.

## Goal
Validate office and technician workflows separately, then produce one approved UI specification and right-sized production implementation plan.

## Required child sequence
1. [UI-006-01 Office Role Task Validation](ui-006-01-office-role-task-validation.md)
2. [UI-006-02 Technician Mobile Task Validation](ui-006-02-technician-mobile-task-validation.md)
3. [UI-006-03 Approved UI Specification and Production Plan](ui-006-03-approved-ui-spec-production-plan.md)

## Shared rules
- Validate real tasks for Manager, Dispatcher, Reviewer, Administrator, and Technician roles.
- Record hesitation, wrong destinations, missed status, context loss, permission confusion, and action misunderstanding.
- Revise source wireframes before final specification approval.
- Preserve every authorized capability and document deferred or rejected alternatives.
- Final approval defines navigation, page anatomy, responsive behavior, interaction patterns, terminology, accessibility, and production slice boundaries.

## Parent acceptance criteria
- Office and technician task validation are complete with outcomes and revisions.
- Critical unresolved findability, accessibility, permission, or workflow-understanding failures are resolved or explicitly block approval.
- UI-006-03 contains the approved specification and small production implementation sequence.

## Guardrail
Do not send this parent to Codex. Approval does not authorize one broad production rewrite.
