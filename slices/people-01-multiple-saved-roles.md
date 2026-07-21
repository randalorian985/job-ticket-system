# Slice: People 01 - Multiple Saved Roles

## Status
Ready for Codex implementation.

## Purpose
Allow one existing person record to hold multiple saved contact roles without creating duplicate people.

## User outcome
A manager can open a person, assign several saved roles, save the record, and later find that person through any matching role filter.

## In scope
- Inspect the current person/contact model before changing it.
- Reuse the existing person/contact entity where practical.
- Add or confirm a Role lookup and PersonRole many-to-many relationship.
- Support these initial saved roles:
  - Service Contact
  - Billing Contact
  - Site Contact
  - After-Hours Contact
  - Safety Contact
- Add role selection to person create/edit using checkboxes or a multi-select.
- Display saved roles on the person list or detail view where useful.
- Add optional role filtering to person search.
- Preserve one optional primary company per person.
- Migrate reliable existing single-role/contact-type values into PersonRole.
- Preserve tenant isolation, active/archive behavior, and existing permissions.
- Update tests and wiki documentation.

## Data requirements
```text
Role
- Id
- Name
- AppliesTo
- IsActive

PersonRole
- PersonId
- RoleId
```

Requirements:
- Add a unique constraint on `(PersonId, RoleId)`.
- Do not store saved roles as comma-separated text.
- Do not create duplicate person records for additional roles.
- Saved roles are classification data, not security permissions.

## API behavior
- Person create and update requests can save zero or more role IDs.
- Person responses include saved roles.
- Person search may accept an optional role filter.
- Role filtering must not change tenant or active-record filtering.
- Reject role and person references outside the current tenant where applicable.

## UI behavior
- Existing person create/edit flows gain a Saved Roles field.
- The field supports multiple selections.
- Existing saved roles are preselected during edit.
- Saving no roles is valid.
- Validation errors should remain on the current form.
- Mobile layouts must remain usable.

## Migration rules
- Preserve current person IDs and company relationships where practical.
- Convert reliable existing contact-type values into saved roles.
- Do not infer roles from ticket history.
- Do not merge possible duplicate people in this slice.
- Existing records must remain readable if no role can be mapped.

## Permissions
- Use existing master-data permissions.
- Manager/Admin or equivalent authorized office roles may edit saved roles.
- Technician access must not be expanded by this slice.

## Tests
Backend:
- One person can hold multiple roles.
- Duplicate PersonRole pairs are rejected.
- Person create/update persists roles.
- Person search can filter by role.
- Tenant boundaries are enforced.

Frontend:
- Multiple roles can be selected and saved.
- Existing selections load correctly during edit.
- Removing one role does not remove the others.
- A person with no roles remains valid.
- Mobile person editing remains usable.

## Acceptance criteria
- One person record can hold several saved roles.
- No duplicate person is needed to represent another role.
- Saved roles appear in person create/edit and responses.
- Search can prioritize or filter by saved role.
- Existing person data is preserved.
- Tests pass and wiki documentation is updated.

## Explicitly out of scope
- Job-ticket service or billing contact fields
- Ticket-only role assignments
- Quick-add from a ticket
- Multiple companies per person
- Duplicate-person merging
- Automatic role changes from usage history

## Codex execution instructions
1. Inspect the current implementation and document the existing person/contact model.
2. Implement only this slice.
3. Do not add ticket contact behavior yet.
4. Add migrations only when required.
5. Run relevant backend and frontend tests.
6. Update the wiki and screenshots for changed UI.
7. Summarize files changed, validation run, and any dependency for Slice 02.

## Definition of done
This slice is complete when multiple saved roles work through the database, API, manager UI, tests, and wiki without altering ticket contact behavior.