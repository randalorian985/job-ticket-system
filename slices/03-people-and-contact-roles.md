# Slice 03: People and Contact Roles

## Goal
Provide reusable person records linked to organizations, with multiple saved contact roles and no duplicate people created merely because someone serves more than one purpose.

## Dependencies
Requires Slice 01 Organizations. May reference Slice 02 locations, but location-specific assignments beyond the current model are deferred unless already supported.

## Existing-system rule
Audit current customer contacts, billing contacts, and person/contact entities. Preserve existing contact data and avoid parallel models.

## Scope
- Person list, create, edit, activate, and deactivate.
- Zero or one primary organization per person in the MVP.
- Multiple saved roles per person.
- Initial roles: Service Contact, Billing Contact, Site Contact, After-Hours Contact, Safety Contact.
- Search by person name, organization, and role.
- Role filters rank and organize people but are not security permissions.
- Migrate reliable existing contact types without inferring roles from history.

## Supporting detail
Use `people-01-multiple-saved-roles.md` and the approved decisions in `people-companies-roles-and-ticket-contacts.md` as implementation references.

## Business rules
- One person record may hold several saved roles.
- Saved roles are suggestions and classifications, not hard restrictions.
- A person must not be duplicated to add another role.
- Deactivated people remain visible on historical records.

## Acceptance criteria
- One person can be both Service Contact and Billing Contact.
- Duplicate person-role rows are prevented.
- Existing contacts are preserved.
- Search and filters work by organization and role.
- Tenant isolation is enforced.

## Tests
- Multi-role persistence and duplicate prevention.
- Search/filter behavior.
- Activation/deactivation.
- Migration and tenant-boundary coverage.

## Definition of done
Person models, role relationships, API, manager UI, migration handling, tests, and wiki documentation are complete and ready for work-order contact assignment.