# Slice 02: Customer Service Locations

## Goal
Allow a customer organization to have one or more service locations that can later hold equipment and be selected during work-order intake.

## Dependency
Requires Slice 01 Organizations.

## Existing-system rule
Audit the current service-location model and ticket location workflow. Reuse and repair existing behavior instead of introducing a second location system.

## Scope
- List service locations for a customer organization.
- Create, edit, activate, and deactivate a service location.
- Required organization relationship.
- Address and location identification fields.
- Optional location number/name and general contact details.
- Search and filtering by customer and location.
- Prevent selection of another tenant's organization.

## Business rules
- One customer may have many service locations.
- Each service location belongs to one customer organization in the MVP.
- Deactivated locations remain on historical work orders but cannot be selected for new work.
- People/location-specific roles are handled in Slice 03; do not build a separate free-form contact system here.

## Acceptance criteria
- A user can create two locations for one customer and distinguish them in search and selectors.
- Existing locations and tickets remain valid.
- Inactive locations remain readable historically.
- Tenant isolation is enforced.

## Tests
- Customer-to-many-locations relationship.
- Validation, activation/deactivation, search, and tenant boundaries.
- Existing ticket location regression coverage.

## Definition of done
Service-location models, APIs, manager UI, tests, migration handling, and wiki documentation are complete and ready for equipment assignment.