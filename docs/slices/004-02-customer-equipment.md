# Slice 004-02: Customer Equipment

## Status
Aligned child of Slice 004.

## Goal
Create or repair canonical physical Customer Equipment management.

## Dependencies
Requires Slices 002-01 and 004-01.

## Scope
- Audit existing physical equipment models, migrations, APIs, screens, selectors, and ticket relationships.
- Provide list, create, view, edit, activate, and deactivate behavior.
- Require customer Organization and Service Location.
- Link an Equipment Type and support manufacturer/model context, serial number, customer asset number, install date, status, notes, and existing fields.
- Search by customer, location, type, manufacturer, model, serial number, and asset number.
- Prevent cross-customer, cross-location, and cross-tenant relationships.
- Preserve historical ticket-equipment references.

## Acceptance criteria
- One location may contain several distinct physical units, including units of the same type.
- Existing equipment and ticket links remain valid.
- Inactive equipment remains historically readable and follows current selection rules.
- Validation, permissions, tenant isolation, migration handling, tests, and wiki documentation are complete.

## Guardrail
Do not implement reusable quick-create, work-order equipment assignment, or scheduling in this child.
