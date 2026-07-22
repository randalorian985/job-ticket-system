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

## Acceptance criteria
- One organization can hold several roles.
- Role changes do not duplicate the organization.
- Existing related records remain usable.
- Tenant isolation and permissions are enforced.
- Relevant tests and wiki documentation are updated.

## Guardrail
Do not redesign locations, people, equipment, work orders, or scheduling in this slice except for the minimum compatibility needed to preserve existing behavior.