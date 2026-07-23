# Slice 005-06: Legacy Workforce Migration and Cutover

## Status
Proposed child of Slice 005.

## Goal
Execute the approved legacy workforce migration, validate all relationships, and retire obsolete creation paths safely.

## Dependencies
Requires approved Slice 005-05 dry-run results with unresolved exceptions dispositioned.

## Scope
- Implement the approved deterministic migration and compatibility mappings.
- Link or migrate legacy workforce records to canonical People.
- Repoint assignments, labor, time, schedules, audit records, and user links as approved.
- Preserve historical attribution and existing identifiers where compatibility requires them.
- Log migrated, skipped, failed, and manually resolved records.
- Run relationship-integrity, count, tenant, history, and rerun-safety validation.
- Execute documented rollback checkpoints when validation fails.
- Retire legacy creation paths only after dependent workflows are verified on Person.

## Acceptance criteria
- Each legacy workforce record is linked to one correct Person or remains in an explicit exception report.
- Historical assignments, labor, time, schedules, and audits remain intact.
- Migration results reconcile with the approved dry run.
- New workforce records use Person-based workflows only after cutover approval.
- Temporary compatibility code is documented with a removal plan.

## Guardrail
Do not combine this cutover with work-order, scheduling-board, navigation, PWA, or unrelated refactoring work.
