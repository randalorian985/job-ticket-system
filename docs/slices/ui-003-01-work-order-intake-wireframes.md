# UI-003-01: Work Order Intake Wireframes

## Status
Planning child of UI-003.

## Goal
Design clear new-work-order intake around the approved information architecture and current business rules.

## Dependencies
Requires UI-002 and UI-001 preservation baseline.

## Scope
- Wireframe desktop new-work-order intake.
- Place customer, Service Location, equipment, contacts, status/priority, description, requested date, notes, and existing required fields.
- Define progressive disclosure and the common one-equipment path while preserving multiple equipment.
- Define quick-create entry points, contextual prefill, caller-state preservation, automatic selection, and focus return.
- Distinguish required, optional, read-only, and permission-limited fields.
- Show save progress, validation errors, unsaved changes, duplicate warnings, and failed quick-create states.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-003/intake/` plus interaction and field-placement notes.

## Acceptance criteria
- The next required intake action is obvious.
- Users understand customer/location/equipment dependencies.
- Quick-create returns to the correct field without losing work.
- Validation and save state are clear without scanning a long form.

## Guardrail
Do not wire production forms or change field requirements, APIs, routes, or business rules.
