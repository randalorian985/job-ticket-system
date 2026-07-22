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
- Provide a reusable minimal quick-create flow for an authorized user who needs to add missing customer equipment from another workflow.

## Quick-create rules
- Require customer organization and service location before quick-create opens.
- Prefill and clearly display the selected customer and location.
- Collect only the minimum valid equipment fields.
- Allow reuse or minimal creation of an equipment type only when authorized and supported by the existing architecture.
- Respect tenant isolation, create permissions, and duplicate serial/asset warnings.
- Return the created equipment record to the calling workflow through a reusable result contract.
- Full editing remains in the Equipment screen.

## Acceptance criteria
- One location can contain multiple equipment units.
- Equipment types are reusable.
- Existing equipment and ticket links remain valid.
- Authorized callers can quick-create equipment for the selected customer and location and receive the saved record.
- Cancel or failed save returns a controlled result without corrupting the calling workflow.
- Tenant isolation, tests, and wiki documentation are updated.

## Guardrail
Do not redesign work-order intake or scheduling in this slice except for the reusable Equipment quick-create contract.