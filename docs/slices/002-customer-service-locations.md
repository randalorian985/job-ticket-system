# Slice 002: Customer Service Locations

## Status
Aligned with Kevin at a high level.

## Goal
Allow a customer organization to have one or more reusable service locations where work and equipment are managed.

## Dependencies
Requires Slice 001.

## Scope
- List, create, view, edit, activate, and deactivate service locations.
- Link every service location to one customer organization.
- Store service address, location name/number, access notes, and basic contact context using existing models where possible.
- Search and filter locations by customer, name, number, or address.
- Preserve existing ticket, equipment, and customer relationships.

## Acceptance criteria
- A customer can have multiple locations.
- A location cannot cross tenant boundaries.
- Existing tickets and equipment still resolve their locations.
- Tests and wiki documentation are updated.

## Guardrail
Do not build equipment, work-order intake, or a full contact-role system in this slice.