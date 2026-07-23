# Slice 002-01: Service Location Core

## Status
Aligned child of Slice 002.

## Goal
Create or repair canonical Service Location management for one customer Organization.

## Dependencies
Requires Slice 001-01.

## Scope
- Audit existing location models, migrations, APIs, selectors, screens, permissions, and ticket/equipment references.
- Provide list, create, view, edit, activate, and deactivate behavior.
- Require one customer Organization.
- Support address, location name/number, access notes, and existing basic location context.
- Search and filter by customer, name, number, and address.
- Reject cross-tenant Organization selection.
- Preserve historical ticket and equipment references.

## Acceptance criteria
- One customer can have several locations that remain distinguishable in search and selectors.
- Existing locations, tickets, and equipment remain valid.
- Inactive locations remain historically readable but cannot be newly selected where prohibited.
- Validation, permissions, tenant isolation, tests, migration handling, and wiki documentation are complete.

## Guardrail
Do not implement reusable quick-create, equipment, work-order intake, or a contact-role system in this child.
