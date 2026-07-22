# Slice 009: Ticket Quick-Add

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Allow authorized users to create missing organizations, people, service locations, and equipment without leaving work-order intake.

## Dependencies
Requires Slices 001 through 006. Scheduling and PWA are not functional dependencies.

## Scope
- Quick-add organization, person, service location, and customer equipment from the relevant work-order selectors.
- Prefill known customer, organization, and location context.
- Preserve unsaved work-order changes.
- Automatically select the new record after save.
- Respect master-data permissions, tenant isolation, and duplicate warnings.
- Audit and consolidate existing quick-add implementations rather than creating parallel forms.

## Supporting detail
See legacy `slices/people-03-ticket-contact-quick-add.md`.

## Acceptance criteria
- Supported quick-add flows work without leaving the ticket.
- Cancel and failed save do not discard work-order changes.
- Desktop and mobile workflows remain usable.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not use this slice to redesign the full application shell or master-data screens.