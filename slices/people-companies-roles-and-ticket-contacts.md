# Parent Scope: People, Companies, Roles, and Ticket Contacts

## Status
Approved design direction. Do not implement this entire document in one Codex run.

## Goal
Create a simple contact model that avoids duplicate records and avoids forcing users to leave a job ticket to edit a person before assigning them.

## Guiding rule
Saved roles help organize and rank records. Ticket assignments determine what a person or company is doing on that job. Saved roles must never block an authorized user from selecting a valid person.

## Approved MVP decisions
- Companies and people remain separate records.
- A company may have multiple classifications such as Customer, Vendor, and Manufacturer.
- A person may have multiple saved roles.
- A person has zero or one primary company in the MVP.
- A ticket has one required customer company.
- Billing party defaults to the customer and may be changed to another company.
- Service contact and billing contact are optional.
- The same person may serve multiple roles on one ticket.
- A person may be used in a ticket role they do not have as a saved role.
- Ticket-only role use must not silently change the person's saved roles.
- Quick-add should allow a missing company or person to be created without leaving ticket entry.

## Implementation sequence
Implement this parent scope through the following small slices, in order:

1. [People 01 - Multiple Saved Roles](people-01-multiple-saved-roles.md)
2. [People 02 - Ticket Contact Assignments](people-02-ticket-contact-assignments.md)
3. [People 03 - Ticket Contact Quick-Add](people-03-ticket-contact-quick-add.md)

Each child slice must be implemented, tested, reviewed, and documented before starting the next one.

## Shared implementation rules
For every slice, Codex must:
1. Inspect the existing models, migrations, APIs, UI components, permissions, tests, and wiki before changing code.
2. Reuse existing conventions and components rather than creating parallel systems.
3. Keep changes limited to the named slice.
4. Preserve tenant isolation and current authorization rules.
5. Preserve existing ticket and contact data.
6. Add focused backend and frontend tests for the slice.
7. Run relevant validation commands.
8. Update the system wiki and screenshots when UI behavior changes.
9. Document dependencies that belong to a later slice instead of implementing them early.
10. Avoid unrelated schema, workflow, or visual redesign.

## Out of scope for this parent feature
- Multiple companies per person
- Parent/subsidiary company hierarchy
- Legal equipment ownership
- Role effective dates
- Contact approval workflows
- Accounting terms, labor rates, or invoice calculations
- Automatic saved-role changes based on ticket history
- Duplicate-record merging
- Complex organization charts

## Parent definition of done
The parent feature is complete only after all three child slices are implemented and validated without regression to existing customer, contact, ticket, mobile, and technician workflows.