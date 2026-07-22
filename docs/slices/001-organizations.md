# Slice 001: Organizations

## Status
Aligned with Kevin at a high level.

## Goal
Provide one shared Organization record that can serve one or more business roles without duplicate records.

## Scope
- Organization list, create, view, edit, activate, and deactivate.
- Roles: Customer, Vendor, Equipment Manufacturer, Part Manufacturer.
- One organization may hold multiple roles.
- Search by organization name or organization number.
- Preserve role-specific customer and vendor information using existing patterns where practical.
- Audit and consolidate existing customer, vendor, and manufacturer implementations rather than creating a parallel Organization system.
- Provide a reusable minimal quick-create flow for an authorized user who needs to create a missing customer or billing organization from another workflow.

## Quick-create rules
- Collect only the minimum fields required for a valid Organization and selected role.
- Respect tenant isolation, create permissions, duplicate warnings, and role-specific validation.
- Return the created Organization to the calling workflow through a reusable result contract.
- Full editing remains in the Organization screen.
- This slice owns the Organization creation capability; later slices only integrate it into their selectors.

## Acceptance criteria
- One organization can hold several roles.
- Role changes do not duplicate the organization.
- Existing related records remain usable.
- Authorized callers can launch the reusable minimal Organization create flow and receive the saved record.
- Cancel or failed save returns a controlled result without corrupting the calling workflow.
- Tenant isolation and permissions are enforced.
- Relevant tests and wiki documentation are updated.

## Guardrail
Do not redesign locations, people, equipment, work orders, or scheduling in this slice except for the reusable Organization quick-create contract and minimum compatibility needed to preserve existing behavior.