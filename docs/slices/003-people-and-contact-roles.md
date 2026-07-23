# Slice 003: People and Contact Roles

## Status
Aligned with Kevin at a high level.

## Goal
Provide one reusable Person identity model for contacts, employees, technicians, managers, dispatchers, and other human roles without creating duplicate records for the same individual.

## Dependencies
Requires Slices 001 and 002.

## Core model
- **Person** is the shared human identity.
- **Saved roles** describe how the person relates to the business or an organization.
- **Employee** is a role and optional workforce profile attached to a Person, not a separate person/master-data record.
- **Technician, Manager, Dispatcher, Billing Contact, Service Contact, Site Contact, Purchasing Contact, Safety Contact, and After-Hours Contact** are roles or capabilities associated with the same Person where applicable.
- Authentication and authorization remain separate from descriptive saved roles.

## Scope
- Person list, create, view, edit, activate, and deactivate.
- Link a person to zero or one primary organization for the MVP.
- Support multiple saved roles, including Employee and Technician, without duplicating the person.
- Support contact roles such as Service Contact, Billing Contact, Site Contact, Safety Contact, Purchasing Contact, and After-Hours Contact.
- Allow an Employee role to expose only the minimum workforce profile fields needed by later slices, such as employee number, active employment status, department or team when already supported, and technician eligibility.
- Preserve the distinction between a Person record, a login/user account, and authorization permissions.
- Search by person, organization, and saved role.
- Audit and migrate existing contact, employee, technician, and user-linked records without creating parallel people systems.
- Preserve historical assignments, time records, and audit history when roles or active status change.
- Provide a reusable minimal quick-create flow for an authorized user who needs to add a missing Person from another workflow.

## Saved-role data and behavior
- Use a normalized Role lookup and Person-to-Role relationship; do not store saved roles as comma-separated text.
- Prevent duplicate Person/Role pairs.
- Saving a Person with no saved roles is valid.
- Existing saved roles must load during edit and may be added or removed independently.
- Reliable existing contact-type values may be migrated to saved roles, but roles must not be inferred from ticket history.
- Saved roles may improve search, filtering, and ranking but are not authorization permissions.

## Quick-create rules
- Collect only the minimum valid Person fields.
- Prefill the selected organization and intended calling context when available.
- Allow optional saved role assignment, but do not silently assign roles merely because the Person is used in a ticket-specific role.
- Show duplicate warnings before creating another Person with matching identifying information.
- Respect tenant isolation and Person-create permissions.
- Return the created Person to the calling workflow through a reusable result contract.
- Full editing, workforce access, and login linkage remain in their proper screens and slices.

## Business rules
- One Person may hold multiple saved roles simultaneously.
- Assigning Employee or Technician must not create a second Person record.
- A Person may exist without an organization, employee role, or login account.
- An Employee may exist without a login account when the business needs a schedulable or historical workforce record.
- A login account may link to no more than one Person within the same tenant unless an existing reviewed design explicitly requires otherwise.
- Saved roles improve search, filtering, and eligibility; they are not authorization permissions by themselves.
- Removing an Employee or Technician role must not delete historical work-order assignments, labor, or schedule history.

## Acceptance criteria
- One person can hold multiple saved roles, including Employee and Technician.
- A person is not duplicated merely to serve another role or gain workforce capabilities.
- Duplicate Person/Role pairs are rejected.
- Person create and edit support zero or more saved roles, and existing selections reload correctly.
- Existing contact, employee, technician, and linked user information is preserved or safely migrated.
- The system can distinguish descriptive roles from authentication and authorization.
- Later workforce and scheduling slices can reference the same Person identity.
- Authorized callers can quick-create a Person and receive the saved record without duplicate identity creation.
- Cancel or failed save returns a controlled result without corrupting the calling workflow.
- Permissions, tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not implement work-order assignment, schedule-board behavior, full workforce access administration, ticket-specific contact assignments, or work-order-specific quick-add integration in this slice. This slice owns only the reusable Person quick-create capability.
