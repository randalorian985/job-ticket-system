# Slice 009: Quick-Add Integration and Consistency

## Status
Proposed parent steering scope only; final hardening after owned quick-create capabilities and caller integrations are complete.

## Goal
Audit, consolidate, and validate proven quick-add implementations without rebuilding master data or calling workflows.

## Dependencies
Requires Slices 001-02, 002-02, 003-03, 004-03, 006-02, 006-04, and 006-06. Broad interaction standardization follows approved UI-006-03 when available.

## Required child sequence
1. [009-01 Quick-Add Lifecycle Contract Audit](009-01-quick-add-lifecycle-audit.md)
2. [009-02 Shared Quick-Add Infrastructure](009-02-shared-quick-add-infrastructure.md)
3. [009-03 Quick-Add Regression and Accessibility](009-03-quick-add-regression-accessibility.md)

## Shared decisions
- Owning master-data children retain record creation rules and APIs.
- Workflow-integration children retain caller-specific state, context, and result behavior.
- This parent owns cross-cutting lifecycle consistency and safe infrastructure consolidation only.
- Consistency must not weaken permissions, tenant isolation, duplicate warnings, validation, or unsaved-state protection.

## Parent acceptance criteria
- All three children are complete.
- Every supported quick-add follows a documented lifecycle contract.
- Shared infrastructure is consolidated only where behavior is equivalent.
- Desktop, mobile, keyboard, focus, permission, validation, and caller-state regressions are covered.

## Guardrail
Do not send this parent to Codex. Do not rebuild master-data forms, work-order intake, navigation, authorization architecture, or offline behavior.
