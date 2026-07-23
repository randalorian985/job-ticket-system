# Slice 005-05: Legacy Workforce Inventory and Dry Run

## Status
Proposed child of Slice 005.

## Goal
Inventory legacy workforce identities and produce a deterministic, non-destructive migration plan and dry-run report.

## Dependencies
Requires Slices 005-01 through 005-04.

## Scope
- Inventory legacy Employee, Technician, Contact, User-link, assignment, labor, time, schedule, and audit relationships.
- Define deterministic matching rules using stable identifiers, tenant, verified email, existing links, and explicit review.
- Define an exception workflow for ambiguous, conflicting, or unmatched records.
- Produce dry-run mappings, record counts, relationship-impact reports, and duplicate-risk reports.
- Define compatibility mappings, rollback checkpoints, and validation queries.
- Prove rerun safety without changing production relationships or retiring legacy paths.

## Acceptance criteria
- Every legacy workforce record is classified as exact match, review required, unmatched, or invalid.
- Dry-run reports show proposed Person mappings and affected relationships.
- Ambiguous name-only matches are never accepted automatically.
- Validation, rollback, and rerun procedures are documented and tested where practical.
- No production cutover or legacy-path retirement occurs.

## Guardrail
This child is discovery and dry run only. Do not repoint production relationships, delete data, or disable legacy creation paths.
