# Slice 003: People and Contact Roles

## Status
Aligned with Kevin at a high level.

## Goal
Provide reusable people linked to organizations with multiple saved contact roles.

## Dependencies
Requires Slices 001 and 002.

## Scope
- Person list, create, view, edit, activate, and deactivate.
- Link a person to zero or one primary organization for the MVP.
- Support multiple saved roles such as Service Contact, Billing Contact, Site Contact, Safety Contact, and After-Hours Contact.
- Saved roles improve search and ranking; they are not security permissions and must not force duplicate people.
- Search by person, organization, and role.
- Audit and migrate existing contact records without creating parallel people systems.

## Supporting detail
See the legacy `slices/people-01-multiple-saved-roles.md` and contact design reference for detailed behavior.

## Acceptance criteria
- One person can hold multiple saved roles.
- A person is not duplicated merely to serve another role.
- Existing contact information is preserved.
- Permissions, tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not implement ticket-specific contact assignments or ticket quick-add in this slice.