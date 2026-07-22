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
- Provide a reusable minimal quick-create flow for an authorized user who needs to add a missing service location from another workflow.

## Quick-create rules
- Require the customer organization before quick-create opens.
- Prefill and lock or clearly display the selected customer context.
- Collect only the minimum valid location fields.
- Respect tenant isolation, create permissions, duplicate/address warnings, and validation.
- Return the created location to the calling workflow through a reusable result contract.
- Full editing remains in the Service Location screen.

## Acceptance criteria
- A customer can have multiple locations.
- A location cannot cross tenant boundaries.
- Existing tickets and equipment still resolve their locations.
- Authorized callers can quick-create a location for the selected customer and receive the saved record.
- Cancel or failed save returns a controlled result without corrupting the calling workflow.
- Tests and wiki documentation are updated.

## Guardrail
Do not build equipment, work-order intake, or a full contact-role system in this slice except for the reusable Service Location quick-create contract.