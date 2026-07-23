# Slice 003-02: Saved Contact Roles

## Status
Aligned child of Slice 003.

## Goal
Add normalized saved contact-role classification to canonical People.

## Dependencies
Requires Slice 003-01.

## Scope
- Audit existing contact types and role-like fields.
- Use a normalized Role lookup and Person-to-Role relationship.
- Support initial saved contact roles such as Service Contact, Billing Contact, Site Contact, Purchasing Contact, Safety Contact, and After-Hours Contact.
- Prevent duplicate Person/Role pairs.
- Allow a Person to have zero or several saved roles.
- Load, add, and remove saved roles independently during Person editing.
- Migrate only reliable existing contact-type values; do not infer roles from ticket history.
- Support search and filtering by saved role.

## Acceptance criteria
- One Person may hold several saved contact roles without duplication.
- Saving a Person without roles remains valid.
- Existing role selections reload correctly and role changes preserve the Person identity.
- Saved roles affect classification, search, and later ranking but do not grant permissions or workforce eligibility.
- Tests and wiki documentation are complete.

## Guardrail
Do not implement Employee/Technician workforce roles, application permissions, ticket-specific role assignment, or Person quick-create in this child.
