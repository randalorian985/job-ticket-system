# Slice 004-01: Equipment Types

## Status
Aligned child of Slice 004.

## Goal
Create or repair reusable Equipment Type classification and maintenance.

## Dependencies
Requires Slice 001-01 for manufacturer Organizations where applicable.

## Scope
- Audit current equipment category, type, manufacturer, model, API, UI, and migration behavior.
- Provide Equipment Type list, create, view, edit, activate, and deactivate behavior.
- Support manufacturer Organization, model/type name, category, and existing descriptive fields.
- Search and filter by manufacturer, type, model, category, and active status.
- Prevent duplicate type definitions where reliable matching is possible.
- Preserve existing customer-equipment and ticket references.

## Acceptance criteria
- Equipment Types are reusable by several physical units.
- Existing type/category/model relationships remain valid.
- Inactive types remain historically readable and follow current selection rules.
- Validation, permissions, tenant isolation, migration handling, tests, and wiki documentation are complete.

## Guardrail
Do not implement physical Customer Equipment records, equipment quick-create, work-order assignment, or scheduling in this child.
