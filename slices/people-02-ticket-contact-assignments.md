# Slice: People 02 - Ticket Contact Assignments

## Status
Ready after People 01 is complete.

## Purpose
Allow dispatchers and managers to assign the correct customer, service contact, billing company, and billing contact to a job ticket without editing master records first.

## Dependencies
- People 01 - Multiple Saved Roles must be complete.
- Existing customer/company and job-ticket workflows must remain functional.

## User outcome
A user can assign ticket contacts quickly, use the same person in multiple roles, and use a person in a ticket role they do not permanently hold.

## In scope
- Add or confirm these ticket relationships:
  - CustomerCompanyId, required
  - ServiceContactPersonId, optional
  - BillingCompanyId, optional
  - BillingContactPersonId, optional
- Default billing party to the customer.
- Allow another active company as billing party.
- Suggest contacts from the relevant company.
- Rank people with the matching saved role first.
- Keep nonmatching contacts selectable.
- Allow the same person as service and billing contact.
- Add nonblocking warnings for company mismatch or missing saved role.
- Add ticket activity entries when assignments change after creation.
- Preserve tenant isolation and existing ticket permissions.
- Add tests and wiki documentation.

## Business rules
- Every ticket requires one customer company.
- A blank BillingCompanyId means `Same as customer`.
- Service contact and billing contact are independent optional fields.
- Ticket assignment does not silently add or remove saved roles.
- Saved roles affect ranking and filtering only.
- A contact outside the expected company may be selected by an authorized user after a warning.
- Inactive records cannot be newly assigned but must remain visible on historical tickets.

## Selector behavior
### Customer company
- Rank active companies classified as Customer first.
- Allow searching all active companies when authorized.

### Service contact
- Suggest active people tied to the customer company.
- Rank saved Service Contacts first.
- Keep other active company people selectable.
- Allow broader search with a nonblocking warning when authorized.

### Billing company
- Default to `Same as customer`.
- When changed, show an active company selector.
- Do not require a permanent Billing Party classification.

### Billing contact
- Suggest active people tied to the effective billing company.
- Rank saved Billing Contacts first.
- Keep other active company people selectable.
- Permit the same person selected as Service Contact.

## Missing-role behavior
When a person lacks the matching saved role, do not block selection.

Example:
```text
Kevin Morales is not marked as a Billing Contact.
- Use for this ticket only
- Add Billing Contact role to Kevin
- Cancel
```

Default action: `Use for this ticket only`.

Only show `Add ... role` when the current user can edit people. Choosing ticket-only use must not modify PersonRole.

## API requirements
- Ticket read responses include IDs and display information for all four assignments.
- Ticket create/update accepts the four assignment IDs.
- Server validation enforces tenant isolation.
- CustomerCompanyId is required.
- Omitted BillingCompanyId resolves to the customer for display and business behavior.
- Historical inactive references remain readable.
- Search endpoints support company and optional role filtering for selectors.

## Activity history
After initial creation, log changes to:
- Customer company
- Service contact
- Billing company
- Billing contact

Each activity entry records field, prior display value, new display value, user, and timestamp. Do not log unsaved form changes.

## Permissions
- Use existing ticket-edit permissions.
- A user allowed to edit the ticket may use a person for a ticket-only role even without person-edit permission.
- Adding a saved role requires existing person-edit permission.
- Technician visibility follows current ticket visibility rules; this slice does not grant master-data editing.

## Tests
Backend:
- Customer company is required.
- Billing company defaults correctly when omitted.
- Same person can fill service and billing roles.
- Person without matching saved role can be assigned.
- Ticket-only assignment does not change PersonRole.
- Cross-tenant IDs are rejected.
- Historical inactive references remain readable.
- Assignment changes create activity entries.

Frontend:
- Matching-role contacts rank first.
- Nonmatching contacts remain selectable.
- Same person can be chosen twice.
- Billing defaults to customer.
- Changing billing company refreshes contact suggestions.
- Missing-role and company-mismatch warnings do not block authorized use.
- Mobile ticket editing remains usable.

End-to-end:
1. Select a customer.
2. Select Kevin as Service Contact.
3. Select Kevin as Billing Contact although he lacks that saved role.
4. Choose `Use for this ticket only`.
5. Save and reopen the ticket.
6. Confirm both assignments remain.
7. Confirm Kevin's saved roles did not change.

## Acceptance criteria
- Tickets support all four assignment fields.
- Customer is required and billing defaults to customer.
- A separate billing company can be selected.
- Role ranking helps but never blocks valid selection.
- The same person can fill multiple ticket roles.
- Ticket-only role use leaves the person profile unchanged.
- Assignment changes are auditable.
- Tests pass and wiki documentation is updated.

## Explicitly out of scope
- Quick-add company or person from ticket selectors
- Multiple companies per person
- Contact approval workflows
- Accounting terms or invoice calculations
- Automatic saved-role updates from ticket usage

## Codex execution instructions
1. Confirm People 01 is complete and inspect the current ticket editor before changing it.
2. Implement only ticket contact assignments.
3. Reuse existing selectors, ticket DTO patterns, activity services, and permissions.
4. Do not implement quick-add; leave that for People 03.
5. Run relevant backend, frontend, and end-to-end tests.
6. Update wiki pages and screenshots for desktop and mobile ticket UI.
7. Summarize changed files, validation, and any dependency for Slice 03.

## Definition of done
This slice is complete when ticket assignments work through persistence, API, manager UI, activity history, permissions, tests, and wiki without adding quick-add behavior.