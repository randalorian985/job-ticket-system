# Slice 006-03: Work Order Contacts

## Status
Aligned with Kevin; child slice of Slice 006.

## Goal
Attach reusable People and Organizations to a work order in job-specific contact roles, including creating a missing Person without leaving intake.

## Dependencies
Requires Slice 006-01 and Slice 003.

## Scope
- Audit existing customer, billing, service-contact, ticket-contact fields, relationships, and quick-add behavior.
- Require the customer organization established by the work-order core.
- Support an optional service contact.
- Default billing organization to the customer while allowing an authorized user to select a different billing organization.
- Support an optional billing contact.
- Allow the same Person to serve in more than one ticket-specific role.
- Rank People using saved roles without preventing an authorized selection.
- Keep ticket-specific role use from silently changing the Person's saved roles.
- Save activity/history when contact assignments change.
- Integrate the reusable Person quick-create capability from Slice 003 into service-contact and billing-contact selectors.

## Work-order quick-add integration rules
- Prefill the selected organization and intended ticket role when available.
- Preserve all unsaved work-order and contact-assignment state.
- Automatically select the newly created Person after a successful save.
- Using the Person in a ticket role must not silently add that role to the Person's saved roles.
- Duplicate warnings must be shown before creating a likely duplicate Person.
- Cancel or failed save must return to the unchanged work order.
- Hide or disable Person quick-create when the user lacks Person-create permission.

## Supporting detail
Use the legacy `slices/people-02-ticket-contact-assignments.md` and `slices/people-03-ticket-contact-quick-add.md` as detailed guidance where they do not conflict with the canonical docs.

## Acceptance criteria
- Service and billing contacts save and reopen correctly.
- The same Person can serve multiple work-order roles without duplication.
- Billing defaults work and can be overridden by authorized users.
- Saved roles improve selection but do not improperly restrict it.
- A missing Person can be created from the contact selector and automatically selected without leaving intake.
- Quick-created ticket use does not silently alter saved Person roles.
- Cancel and failed save preserve the work-order state.
- Existing contact data is preserved or safely migrated.
- Permissions, tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not implement technician assignment, scheduling, labor, parts, or broad Person-role redesign in this slice.