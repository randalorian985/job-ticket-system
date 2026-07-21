# Slice: People, Companies, Roles, and Ticket Contacts

## Status
Ready for implementation.

## Goal
Create a simple contact model that avoids duplicate records and avoids forcing users to edit a person before using them on a job ticket.

## Guiding rule
Saved roles help organize and rank records. Ticket assignments determine what a person or company is doing on that job. Saved roles must never block an authorized user from selecting a valid person.

## Scope
This slice includes:
- Separate Company and Person records.
- Multiple saved roles per person.
- Multiple classifications per company.
- One primary company per person for the MVP.
- Ticket-specific customer, service contact, billing party, and billing contact selections.
- The ability to use a person in a ticket role they do not have permanently.
- The ability to assign the same person to multiple roles on one ticket.
- Quick-add for a company or person without leaving ticket entry.

## Company model
A Company represents a business or organization.

Required and optional fields:
```text
Company
- Id
- Name, required
- Phone, optional
- Email, optional
- Comment, optional
- IsActive
```

Company classifications are many-to-many. Initial values:
- Customer
- Vendor
- Manufacturer

Billing Party is not a required permanent classification. It is a job-ticket relationship.

## Person model
A Person represents an individual.

```text
Person
- Id
- CompanyId, optional
- FirstName, required
- LastName, required
- Phone, optional
- Email, optional
- JobTitle, optional
- Comment, optional
- IsActive
```

For the MVP, a person may have zero or one primary company. Multiple-company relationships are deferred.

## Saved person roles
A person may have multiple saved roles. Initial roles:
- Service Contact
- Billing Contact
- Site Contact
- After-Hours Contact
- Safety Contact

```text
PersonRole
- PersonId
- RoleId
```

Use a unique constraint on `(PersonId, RoleId)`.

Saved roles are not security permissions. They only improve organization, searching, and suggestion order.

## Ticket relationships
The job ticket determines the role a record serves for that job.

```text
JobTicket
- CustomerCompanyId, required
- ServiceContactPersonId, optional
- BillingCompanyId, optional
- BillingContactPersonId, optional
```

Rules:
- Every ticket requires one customer company.
- A blank BillingCompanyId means the customer is also the billing party.
- Service and billing contacts may be the same person.
- A contact may be selected even if the matching saved role is absent.
- Ticket assignment must not silently modify saved roles.

## Ticket user experience
### Customer
1. Select the customer company.
2. Search active companies classified as Customer first.
3. Allow searching all active companies.
4. Provide quick-add company.

### Service contact
1. Suggest active people tied to the selected customer.
2. Rank saved Service Contacts first.
3. Allow searching all active people tied to the company.
4. Allow broader search when authorized.
5. Provide quick-add person with the customer preselected.

### Billing party
1. Default to `Same as customer`.
2. When unchecked, show a company selector.
3. Allow any active company to be selected.
4. Do not require a permanent Billing Party classification.

### Billing contact
1. If billing party equals customer, suggest that company's people.
2. If another billing company is selected, suggest that company's people.
3. Rank saved Billing Contacts first.
4. Allow any active person for that company.
5. Permit the same person used as Service Contact.

## Missing-role behavior
When a selected person lacks the matching saved role, do not block the selection.

The UI may show a non-blocking message:
```text
Kevin Morales is not marked as a Billing Contact.
- Use for this ticket only
- Add Billing Contact role to Kevin
- Cancel
```

Default action: `Use for this ticket only`.

Only add the saved role when the user deliberately chooses that action and has permission to edit people.

## Quick-add behavior
Quick-add must remain in the ticket workflow.

Quick-add Company requires only:
- Name
- Optional classification
- Optional phone or email

Quick-add Person requires only:
- First name
- Last name
- Company prefilled when launched from a company contact selector
- Optional phone or email
- Optional saved roles

After save, automatically select the new record in the ticket field that launched quick-add.

## Validation
- Company name is required.
- Person first and last name are required.
- Selected contacts must be active when adding them to a ticket.
- Service contact should normally belong to the customer company, but authorized users may override.
- Billing contact should normally belong to the billing company, but authorized users may override.
- An override should warn, not block.
- Do not create duplicate PersonRole rows.
- Do not create a second person record merely because another role is needed.

## API expectations
Provide or update endpoints for:
- List/search companies with optional classification filtering.
- Create and edit a company.
- List/search people by company and optional role.
- Create and edit a person.
- Add or remove saved person roles.
- Read and save ticket customer/contact assignments.

Search responses should include enough display data for selectors:
- Record ID
- Display name
- Company name for people
- Phone/email when useful
- Saved roles
- Active status

Server-side validation must enforce tenant isolation and reject references to records outside the current tenant.

## Permissions
- Manager/Admin: create and edit companies and people, edit saved roles, and assign ticket contacts.
- Authorized office roles may assign ticket contacts and use quick-add according to existing master-data permissions.
- Technicians may view technician-visible ticket contacts but should not receive master-data editing access from this slice.
- A user without person-edit permission may still use a person for a ticket-only role when permitted to edit the ticket.

## Activity history
Add a ticket activity entry when customer, service contact, billing party, or billing contact changes after initial ticket creation.

The entry should record:
- Field changed
- Previous display value
- New display value
- User
- Timestamp

Do not create activity noise for unsaved form changes.

## Migration
- Preserve existing customer/company IDs where practical.
- Migrate existing customer contacts into Person records tied to their company.
- Preserve existing phone, email, title, and notes.
- Map obvious existing contact types into saved roles when reliable.
- Do not infer extra roles from ticket history.
- Do not duplicate a person for each existing contact type.
- Existing tickets must continue to load even if older contact fields cannot be fully mapped.

## Testing
Backend tests:
- One person can hold multiple saved roles.
- Duplicate PersonRole rows are rejected.
- A ticket can use a person in a role not saved on the person.
- A ticket-only assignment does not alter PersonRole.
- Customer is required.
- Billing company defaults correctly when omitted.
- Tenant boundaries are enforced.

Frontend tests:
- Matching-role contacts rank first.
- Nonmatching contacts remain selectable.
- Same person can be service and billing contact.
- Billing party defaults to same as customer.
- Selecting another billing company changes billing-contact suggestions.
- Quick-add returns and selects the new record.
- Mobile workflow does not require leaving the ticket.

End-to-end scenario:
1. Create/select a customer.
2. Select Kevin as Service Contact.
3. Use Kevin as Billing Contact even though he lacks that saved role.
4. Choose `Use for this ticket only`.
5. Save and reopen the ticket.
6. Confirm both assignments remain.
7. Confirm Kevin's saved roles did not change.

## Acceptance criteria
- A company can have many people.
- A person has one optional primary company in the MVP.
- A person can have multiple saved roles.
- A company can have multiple classifications.
- One person record may fill multiple ticket roles.
- A ticket requires one customer company.
- Billing party defaults to the customer.
- Another billing company can be selected.
- Saved roles improve suggestions but never block selection.
- Ticket-only role use does not change the person's profile.
- Users can intentionally add a saved role from the ticket when permitted.
- Quick-add works without leaving the ticket.
- Existing customer/contact data is preserved during migration.

## Out of scope
- Multiple companies per person.
- Parent/subsidiary company hierarchy.
- Legal ownership relationships.
- Role effective dates.
- Contact approval workflows.
- Accounting terms, labor rates, and invoice calculations.
- Automatic saved-role changes based on ticket history.
- Duplicate-record merging.
- Complex organization charts.

## Definition of done
The slice is complete when migrations, backend models and endpoints, manager ticket UI, quick-add flows, permissions, activity entries, tests, and relevant wiki documentation are updated and existing ticket workflows continue to function without regression.
