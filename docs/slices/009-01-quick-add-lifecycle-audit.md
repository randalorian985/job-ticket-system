# Slice 009-01: Quick-Add Lifecycle Contract Audit

## Status
Proposed child of Slice 009.

## Goal
Inventory every supported quick-add flow and define the canonical lifecycle contract before changing shared infrastructure.

## Scope
- Audit Organization, Service Location, Person, and Customer Equipment quick-create capability and each calling-workflow integration.
- Document open, contextual prefill, validation, duplicate warning, save, cancel, failure, result, automatic selection, focus return, and unsaved-caller-state behavior.
- Record permission, tenant, mobile, keyboard, accessibility, and error-state differences.
- Classify differences as intentional context, defect, or safe consolidation opportunity.
- Produce a conformance matrix and proposed contract without changing production behavior.

## Acceptance criteria
- Every supported quick-add flow is represented in the audit.
- Ownership remains traceable to the applicable master-data and workflow child.
- Intentional differences are distinguished from defects.
- The canonical lifecycle contract and consolidation candidates are reviewed.
- No production behavior changes occur.

## Guardrail
This child is audit and specification only. Do not refactor components, APIs, forms, or callers.
