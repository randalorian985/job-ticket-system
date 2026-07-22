# Slice 06: Work Order Intake

## Goal
Deliver a complete intake flow that creates a valid backlog work order tied to the correct customer, location, equipment, and contacts.

## Dependencies
Requires Slices 01 through 05.

## Existing-system rule
Audit the current job-ticket editor, API, validation, customer/location/equipment selectors, assignments, mobile behavior, and activity history. Repair and extend the existing workflow rather than creating another work-order screen.

## Scope
- Create and edit a work order.
- Required customer organization.
- Required service location belonging to that customer.
- One or more customer equipment units through the existing ticket-equipment relationship.
- Optional service contact.
- Billing organization defaults to the customer and may be changed.
- Optional billing contact.
- Work description, priority, status, and other existing intake fields required for backlog creation.
- Save to backlog without requiring technician or schedule assignment.
- Rank contacts by saved role without restricting valid selection.
- Allow the same person to serve as service and billing contact.
- Allow ticket-only role use without silently changing saved roles.
- Record activity when customer, location, equipment, or contacts change after creation.

## Supporting detail
Use `people-02-ticket-contact-assignments.md` and `people-companies-roles-and-ticket-contacts.md` for contact-assignment rules.

## Business rules
- Customer, location, and selected equipment must belong to the current tenant.
- Location must belong to the selected customer.
- Equipment must belong to the selected location unless an authorized override already exists and is preserved.
- At least one equipment unit should be supported; multiple units remain allowed.
- Billing organization omitted means same as customer.
- Saved contact roles influence ranking only.
- Assignment and scheduling are handled in Slice 07.

## Acceptance criteria
- A user can complete Customer -> Location -> Equipment -> Work Order -> Backlog.
- A work order can contain multiple equipment units.
- A person can be used in a ticket role not saved on their profile.
- Reopening the work order preserves all selections.
- Existing mobile and desktop ticket workflows continue to function.
- Tenant isolation and validation are enforced.

## Tests
- Full intake tracer bullet.
- Customer/location/equipment dependency validation.
- Multiple equipment units.
- Ticket-only contact roles and same-person dual roles.
- Save/reopen behavior, activity history, mobile workflow, and tenant boundaries.

## Definition of done
The existing work-order intake workflow creates a valid backlog item with all required relationships, tests pass, and the wiki and screenshots are updated.