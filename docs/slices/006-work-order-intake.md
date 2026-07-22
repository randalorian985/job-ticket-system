# Slice 006: Work Order Intake

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Create or repair a complete work-order intake flow that produces a valid backlog work order from the approved master data.

## Dependencies
Requires Slices 001 through 005.

## Scope
- Select customer organization, service location, one or more equipment units, service contact, and optional billing organization/contact.
- Capture service scope, priority, status, requested date, notes, and existing required fields.
- Save a new work order into the backlog without requiring scheduling.
- Preserve the current decision that a work order may contain multiple equipment units.
- Allow the same person to serve more than one ticket role.
- Saved contact roles rank suggestions but do not block authorized selection.
- Audit and repair the existing job-ticket workflow rather than creating a parallel intake screen.

## Supporting detail
See legacy `slices/people-02-ticket-contact-assignments.md` for ticket-contact rules.

## Acceptance criteria
- Customer -> Location -> Equipment -> Work Order -> Backlog works end to end.
- Saved and reopened work orders preserve all selected relationships.
- Existing tickets continue to load.
- Permissions, activity history, tests, and wiki documentation are updated.

## Guardrail
Do not build the scheduling board or broad quick-add behavior in this slice.