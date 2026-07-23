# Slice 003: People and Contact Roles

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Provide one canonical Person identity, normalized saved contact roles, and one reusable Person quick-create capability without absorbing workforce or authorization work.

## Dependencies
Requires Slices 001-01 and 002-01.

## Required child sequence
1. [003-01 Person Core](003-01-person-core.md)
2. [003-02 Saved Contact Roles](003-02-saved-contact-roles.md)
3. [003-03 Person Quick-Create](003-03-person-quick-create.md)

## Shared decisions
- Person is the shared human identity.
- A Person may have zero or one primary Organization in the MVP.
- Saved contact roles are descriptive classifications, not application permissions or workforce eligibility.
- One Person may hold several saved roles without duplication.
- Employee/Technician workforce profiles, login linkage, authorization, and legacy workforce migration belong to Slice 005.
- Ticket-specific contact assignment belongs to Slice 006.

## Parent acceptance criteria
- All three children are complete.
- Existing contact information is preserved or migrated safely.
- One Person may hold multiple saved contact roles without duplicate identity records.
- Later workforce and work-order slices can depend on one Person model and one quick-create contract.

## Guardrail
Do not send this parent to Codex. Do not implement workforce profiles, user linkage, authorization, ticket-specific contact assignment, or scheduling in Slice 003.
