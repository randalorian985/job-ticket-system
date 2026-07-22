# Slice 005-04: Legacy Employee and Technician Migration

## Status
Proposed; child slice of Slice 005.

## Goal
Migrate or reconcile legacy Employee, Technician, Contact, and User-linked records into the centralized Person model without losing history or creating duplicates.

## Dependencies
Requires Slices 005-01 through 005-03.

## Scope
- Inventory legacy employee, technician, contact, user, assignment, labor, time, and schedule relationships.
- Define deterministic matching rules and a manual-review path for ambiguous records.
- Link or migrate legacy workforce records to Person.
- Preserve existing primary keys or compatibility mappings where required by dependent code.
- Repoint assignments, labor, time entries, schedule history, audit records, and user links safely.
- Add migration logging, validation reports, rollback planning, and duplicate detection.
- Retire legacy creation paths after all dependent workflows use Person.
- Keep temporary compatibility code narrowly scoped and documented for later removal.

## Business rules
- Never merge people solely because names match.
- Prefer stable identifiers, verified email, existing user links, tenant, and explicit administrator review.
- Historical records must remain readable and attributable.
- Migration must be repeatable or safely idempotent where practical.
- Do not delete legacy data until validation proves all required relationships were migrated.

## Acceptance criteria
- Each legacy employee and technician is linked to one correct Person or appears in an exception report.
- Historical assignments, labor, time, schedules, and audit records remain intact.
- Duplicate Person creation is prevented.
- New workforce records are created through Person-based workflows only.
- Migration validation reports record counts, unresolved exceptions, and relationship integrity.
- Tests cover exact match, ambiguous match, no match, rerun safety, rollback strategy, and tenant isolation.

## Guardrail
Do not combine this migration with work-order, scheduling-board, navigation, or PWA redesign work.