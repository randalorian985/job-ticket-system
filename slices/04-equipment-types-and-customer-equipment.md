# Slice 04: Equipment Types and Customer Equipment

## Goal
Allow reusable equipment types and physical customer equipment units to be created, assigned to service locations, and selected later on work orders.

## Dependencies
Requires Slice 01 Organizations and Slice 02 Customer Service Locations.

## Existing-system rule
Audit current equipment, manufacturer, model, category, and ticket-equipment behavior. Preserve existing IDs and multi-equipment ticket support.

## Scope
- Equipment type/category list and maintenance.
- Equipment manufacturer relationship to an Organization with the Equipment Manufacturer role.
- Customer equipment list by organization and service location.
- Create, edit, activate, and deactivate a physical equipment unit.
- MVP unit fields: manufacturer, model, serial number optional, customer unit number optional, comment optional.
- Search by customer, location, manufacturer, model, serial number, or customer unit number.
- Prepare selectors for work-order intake.

## Business rules
- One service location may have many equipment units.
- One equipment unit belongs to one customer service location in the MVP.
- Historical work orders retain deactivated equipment references.
- Work orders may include multiple equipment units through the existing ticket-equipment relationship.
- Do not add legal ownership rules in this slice.

## Acceptance criteria
- A customer location can hold several distinct equipment units.
- Units with the same model remain separate physical records.
- Existing ticket-equipment links continue to load.
- Inactive units cannot be selected for new work but remain historically visible.
- Tenant isolation is enforced.

## Tests
- Location-to-many-equipment relationship.
- Physical unit uniqueness and search behavior.
- Activation/deactivation and historical references.
- Multi-equipment compatibility and tenant boundaries.

## Definition of done
Equipment type and customer-equipment models, APIs, manager UI, migration handling, tests, and wiki documentation are complete and ready for work-order intake.