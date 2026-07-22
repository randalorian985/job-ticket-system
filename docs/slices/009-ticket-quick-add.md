# Slice 009: Quick-Add Integration and Consistency

## Status
Proposed; final consistency pass after the underlying quick-create capabilities and work-order integrations are complete.

## Goal
Audit, standardize, and polish all quick-add experiences so they behave consistently across desktop and mobile without rebuilding the underlying master-data create flows.

## Dependencies
Requires the quick-create capabilities owned by Slices 001 through 004 and their work-order integrations in Slices 006-01 through 006-03. Scheduling and PWA are not functional dependencies.

## Ownership model
- Slice 001 owns Organization quick-create.
- Slice 002 owns Service Location quick-create.
- Slice 003 owns Person quick-create.
- Slice 004 owns Customer Equipment quick-create.
- Slices 006-01 through 006-03 own integration into work-order intake.
- This slice owns cross-cutting consistency, cleanup, and regression prevention.

## Scope
- Audit all current quick-add drawers, dialogs, modals, selectors, save handlers, and mobile flows.
- Standardize open, save, cancel, failure, and return-to-caller behavior.
- Standardize automatic selection of newly created records.
- Standardize preservation of unsaved calling-workflow state.
- Standardize prefilled customer, organization, location, and role context.
- Standardize permission visibility and unauthorized behavior.
- Standardize duplicate warnings and validation presentation.
- Ensure dialogs and drawers are usable on supported mobile widths and in the future standalone PWA shell.
- Consolidate duplicate UI infrastructure only where safe and within this slice's scope.
- Preserve existing master-data screens and APIs.

## Explicitly out of scope
- Building a new Organization, Person, Location, or Equipment creation system.
- Broad redesign of work-order intake.
- Application-shell or navigation redesign.
- Full offline quick-add or background synchronization.
- Changes to authentication or authorization architecture beyond enforcing existing permissions.

## Acceptance criteria
- Every supported quick-add flow follows the same lifecycle and return contract.
- Successful save selects the new record in the calling workflow.
- Cancel and failed save do not discard unsaved calling-workflow data.
- Prefill behavior is correct and tenant-safe.
- Unauthorized users do not see or cannot execute quick-create actions.
- Duplicate warnings and validation are consistent.
- Desktop and mobile workflows remain usable.
- Existing quick-add implementations are consolidated where appropriate without regressions.
- Tests, wiki documentation, and screenshots are updated.

## Guardrail
Treat this as a consistency and hardening slice, not as permission to rebuild master data or the full ticket workflow.