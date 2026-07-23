# Slice 006-05: Work Order Contact Assignment

## Status
Aligned child of Slice 006.

## Goal
Assign existing People and Organizations to service and billing roles on a work order.

## Dependencies
Requires Slices 006-01, 003-02, and 001-01.

## Scope
- Audit existing service-contact, billing-organization, billing-contact, and ticket-contact relationships.
- Support optional service contact.
- Default billing Organization to the customer while allowing an authorized override.
- Support optional billing contact.
- Allow the same Person in more than one ticket-specific role.
- Rank People using saved contact roles without restricting other authorized active People.
- Use a Person for a ticket-only role without changing saved roles.
- Show nonblocking organization/role mismatch warnings where useful.
- Preserve inactive historical references and reject new cross-tenant assignments.
- Record saved contact-assignment changes in activity history.

## Acceptance criteria
- Service and billing assignments save and reopen correctly.
- Billing defaults and authorized overrides work.
- Same-Person dual roles work without duplication.
- Saved roles improve ranking but do not grant permission or restrict valid selection.
- Changes are auditable and covered by focused tests and documentation.

## Guardrail
Do not implement Person quick-create, technician assignment, scheduling, labor, or parts in this child.
