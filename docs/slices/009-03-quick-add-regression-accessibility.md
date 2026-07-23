# Slice 009-03: Quick-Add Regression and Accessibility

## Status
Proposed child of Slice 009.

## Goal
Validate every supported quick-add flow across callers, roles, viewports, failures, and accessibility states after consolidation.

## Dependencies
Requires Slice 009-02.

## Scope
- Validate Organization, Service Location, Person, and Customer Equipment quick-add in every supported caller.
- Cover authorized and unauthorized users, tenant boundaries, duplicates, validation failure, network failure, cancel, save, automatic selection, and unsaved-caller-state preservation.
- Validate keyboard navigation, focus containment and return, screen-reader naming, error association, touch targets, mobile widths, and high-content states.
- Confirm intentional workflow-specific differences remain intact.
- Update the conformance matrix, wiki, and screenshots.

## Acceptance criteria
- Every supported flow passes the canonical lifecycle contract.
- No caller loses unsaved state after cancel or failure.
- Unauthorized and cross-tenant actions remain blocked.
- Focus and accessibility behavior is correct on desktop and mobile.
- Regression coverage identifies the caller and record type for failures.
- Documentation and screenshots reflect final behavior.

## Guardrail
Do not use validation findings to expand scope into master-data, work-order, navigation, authorization, or offline redesign; create a new scoped child when a separate capability is required.
