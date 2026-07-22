# Slice 006-03: Work Order Contacts

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Attach reusable People and Organizations to a work order in job-specific contact roles.

## Dependencies
Requires Slice 006-01 and Slice 003.

## Scope
- Audit existing customer, billing, service-contact, and ticket-contact fields and relationships.
- Require the customer organization established by the work-order core.
- Support an optional service contact.
- Default billing organization to the customer while allowing an authorized user to select a different billing organization.
- Support an optional billing contact.
- Allow the same Person to serve in more than one ticket-specific role.
- Rank People using saved roles without preventing an authorized selection.
- Keep ticket-specific role use from silently changing the Person's saved roles.
- Save activity/history when contact assignments change.

## Supporting detail
Use the legacy `slices/people-02-ticket-contact-assignments.md` as detailed guidance where it does not conflict with the canonical docs.

## Acceptance criteria
- Service and billing contacts save and reopen correctly.
- The same Person can serve multiple work-order roles without duplication.
- Billing defaults work and can be overridden by authorized users.
- Saved roles improve selection but do not improperly restrict it.
- Existing contact data is preserved or safely migrated.
- Permissions, tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not implement contact quick-add, technician assignment, scheduling, labor, parts, or broad Person-role redesign in this slice.