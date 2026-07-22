# Slice 004: Equipment Types and Customer Equipment

## Status
Aligned with Kevin at a high level.

## Goal
Create reusable equipment types and physical customer-equipment records tied to organizations and service locations.

## Dependencies
Requires Slices 001 and 002.

## Scope
- Equipment-type list, create, edit, activate, and deactivate.
- Customer-equipment list, create, view, edit, activate, and deactivate.
- Link each physical unit to a customer organization and service location.
- Support manufacturer, model, serial/asset number, install date, status, and notes using existing fields where practical.
- Search and filter by customer, location, type, manufacturer, model, serial number, or asset number.
- Preserve existing job-ticket equipment relationships.

## Acceptance criteria
- One location can contain multiple equipment units.
- Equipment types are reusable.
- Existing equipment and ticket links remain valid.
- Tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not redesign work-order intake or scheduling in this slice.