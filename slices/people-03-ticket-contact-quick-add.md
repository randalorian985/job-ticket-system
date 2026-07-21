# Slice: People 03 - Ticket Contact Quick-Add

## Status
Ready after People 02 is complete.

## Purpose
Allow an authorized user to create a missing company or person from a ticket selector and return directly to the ticket with the new record selected.

## Dependencies
- People 01 - Multiple Saved Roles must be complete.
- People 02 - Ticket Contact Assignments must be complete.
- Existing quick-add and drawer/modal patterns should be reused where practical.

## User outcome
A dispatcher can create a missing customer, billing company, service contact, or billing contact without leaving ticket entry or losing unsaved ticket work.

## In scope
- Quick-add Company from customer and billing-company selectors.
- Quick-add Person from service-contact and billing-contact selectors.
- Prefill the relevant company when quick-adding a person.
- Return the new record to the selector that launched quick-add.
- Automatically select the newly created record after save.
- Preserve unsaved ticket form state while quick-add is open.
- Respect existing master-data permissions.
- Keep desktop and mobile flows usable.
- Add focused backend, frontend, and end-to-end tests.
- Update the wiki and screenshots.

## Quick-add Company
Minimum fields:
- Name, required
- Optional classification
- Optional phone
- Optional email

Behavior:
- Launch from the customer or billing-company selector.
- Use an existing drawer/modal pattern rather than navigating away.
- On successful save, close quick-add and select the new company in the launching field.
- When launched from Customer, default classification to Customer when that matches existing conventions.
- When launched from Billing Company, do not require a permanent Billing Party classification.
- Keep the ticket's other unsaved values intact.

## Quick-add Person
Minimum fields:
- First name, required
- Last name, required
- Company, prefilled from the effective customer or billing company
- Optional phone
- Optional email
- Optional saved roles

Behavior:
- Launch from the service-contact or billing-contact selector.
- Prefill and normally lock or strongly default the relevant company while allowing authorized correction.
- On successful save, close quick-add and select the new person in the launching field.
- A saved role is optional.
- Do not require Billing Contact or Service Contact to create the person.
- Keep the ticket's other unsaved values intact.

## State and navigation requirements
- Opening quick-add must not change the route unexpectedly.
- Browser Back should not discard the ticket because a drawer/modal was opened.
- Closing or cancelling quick-add returns focus to the launching selector.
- Cancelling must not create a record or alter the selector value.
- Validation errors remain inside quick-add and do not reset the ticket.
- Reopening quick-add must not show stale data from the previous attempt.

## Permissions
- Show quick-add only when the user has permission to create the relevant master record.
- Users without create permission can still search and assign existing records according to People 02.
- This slice must not grant technicians new master-data permissions.
- Server-side authorization must not rely only on whether the button is hidden.

## API requirements
- Reuse existing company and person create endpoints where possible.
- Create responses must return selector-ready data, including ID and display name.
- Person create response should include company and saved-role display data needed by the selector.
- Enforce tenant isolation and existing validation rules.
- Avoid creating special ticket-only company/person endpoints unless the current architecture requires them.

## Error handling
- Duplicate warnings should follow existing master-data behavior and should not silently merge records.
- Network or validation failure must leave the ticket form intact.
- A failed save must not insert a temporary selector option.
- If the ticket's selected company changes while quick-add is open, prevent saving against stale context or clearly confirm the intended company.

## Mobile requirements
- Quick-add must fit within the mobile viewport.
- Primary actions remain visible without excessive scrolling.
- Keyboard opening must not hide Save/Cancel controls.
- Returning from quick-add restores the user to the contact section of the ticket.
- Avoid full-page navigation and deep-scroll work loops.

## Tests
Backend:
- Authorized users can create companies and people.
- Unauthorized users are rejected.
- Tenant boundaries are enforced.
- Required fields are validated.
- Create responses contain selector-ready fields.

Frontend:
- Quick-add appears only with permission.
- Launching from each supported selector uses the correct context.
- Person company is prefilled correctly.
- Successful save selects the new record.
- Cancel preserves the prior ticket value.
- Validation errors preserve ticket state.
- Reopening quick-add resets stale form values.
- Mobile layout and focus return work correctly.

End-to-end scenarios:
1. Start a new ticket and enter unsaved ticket details.
2. Quick-add a customer company.
3. Confirm the company is selected and other ticket details remain.
4. Quick-add a service contact with the customer prefilled.
5. Confirm the person is selected.
6. Save and reopen the ticket.
7. Confirm both new records and assignments persist.

Second scenario:
1. Select a separate billing company.
2. Quick-add a billing contact.
3. Confirm the billing company is prefilled.
4. Cancel and verify no person was created and ticket values remain unchanged.

## Acceptance criteria
- Missing companies and people can be created from the correct ticket selectors.
- Users never have to leave ticket entry for quick-add.
- Newly created records are automatically selected.
- Unsaved ticket state survives success, cancellation, and validation errors.
- Permissions are enforced in UI and API.
- Desktop and mobile workflows remain usable.
- Tests pass and wiki screenshots are updated.

## Explicitly out of scope
- Duplicate-record merging
- Bulk imports
- Multiple companies per person
- New customer hierarchy features
- Contact approval workflows
- Automatic saved-role assignment based on selector usage
- Redesign of unrelated ticket sections

## Codex execution instructions
1. Confirm People 01 and People 02 are complete.
2. Inspect existing quick-add, drawer, modal, form-state, and routing patterns before coding.
3. Reuse existing company/person endpoints and components.
4. Implement only the four ticket-selector quick-add entry points.
5. Preserve unsaved ticket state and route behavior.
6. Run focused backend, frontend, and end-to-end tests.
7. Update wiki documentation and desktop/mobile screenshots.
8. Summarize changed files, validation run, and any deferred issues.

## Definition of done
This slice is complete when quick-add works from all four supported ticket selectors, preserves ticket state, respects permissions, passes tests, and is documented in the wiki without changing unrelated ticket workflows.