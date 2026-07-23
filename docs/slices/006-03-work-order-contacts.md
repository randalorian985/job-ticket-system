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
- Show nonblocking warnings for organization mismatch or missing saved role where useful.
- Save activity/history when contact assignments change.
- Integrate the reusable Person quick-create capability from Slice 003 into service-contact and billing-contact selectors.

## Contact selection rules
- Every work order requires one customer organization.
- A blank billing organization means same as customer.
- Service contact and billing contact are independent and optional.
- The same Person may fill both roles.
- Matching saved roles rank first, but other authorized active People remain selectable.
- Selecting a Person for a ticket-only role must not alter that Person's saved roles.
- Inactive People or Organizations cannot be newly assigned but remain readable on historical work orders.
- Cross-tenant Person and Organization references must be rejected.

## Missing-role behavior
When a selected Person lacks the matching saved role, default to using the Person for this work order only. An optional action to add the saved role may be offered only when the current user has Person-edit permission. The ticket-only path must never modify the Person profile.

## Work-order quick-add integration rules
- Prefill the selected organization and intended ticket role when available.
- Preserve all unsaved work-order and contact-assignment state.
- Automatically select the newly created Person after a successful save.
- Using the Person in a ticket role must not silently add that role to the Person's saved roles.
- Duplicate warnings must be shown before creating a likely duplicate Person.
- Cancel or failed save must return to the unchanged work order.
- Hide or disable Person quick-create when the user lacks Person-create permission.
- Validation errors remain inside quick-create and must not reset the work order.
- Closing quick-create returns focus to the launching selector where practical.

## Activity history
After initial creation, record changes to customer organization, service contact, billing organization, and billing contact with prior value, new value, user, and timestamp. Do not log unsaved form changes.

## Acceptance criteria
- Service and billing contacts save and reopen correctly.
- The same Person can serve multiple work-order roles without duplication.
- Billing defaults work and can be overridden by authorized users.
- Saved roles improve selection but do not improperly restrict it.
- A Person without the matching saved role can be used for the work order without changing the Person profile.
- A missing Person can be created from the contact selector and automatically selected without leaving intake.
- Cancel, failed save, and validation errors preserve work-order state.
- Existing contact data is preserved or safely migrated.
- Assignment changes are auditable.
- Permissions, tenant isolation, backend/frontend/end-to-end tests, and wiki documentation are updated.

## Guardrail
Do not implement technician assignment, scheduling, labor, parts, or broad Person-role redesign in this slice.
