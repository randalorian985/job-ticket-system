# Slice 01: Organizations

## Goal
Provide one shared organization model that can represent customers, vendors, equipment manufacturers, and part manufacturers without duplicate records.

## Existing-system rule
Audit the current customer, vendor, and manufacturer models before changing code. Consolidate only where necessary and preserve existing IDs and workflows.

## Scope
- Organization list and detail/edit views.
- Create and edit an organization.
- Multiple organization roles/classifications.
- Initial roles: Customer, Vendor, Equipment Manufacturer, Part Manufacturer.
- Role activation and deactivation without deleting the organization.
- Search by organization name or existing organization/account number.
- Preserve role-specific fields already required by customer or vendor workflows.

## Business rules
- One organization may hold several roles.
- A new role must not require creating a duplicate organization.
- Deactivating one role must not deactivate unrelated roles.
- Billing Party is a work-order relationship, not a required permanent organization role.

## Acceptance criteria
- One organization can be both Customer and Vendor.
- Existing customer and vendor records continue to work.
- Organization search returns the same record regardless of active role.
- Role filters show only organizations with that role.
- Tenant isolation is enforced.

## Tests
- Multiple-role persistence.
- Duplicate role prevention.
- Role activation/deactivation.
- Search and tenant isolation.
- Regression coverage for existing customer/vendor workflows.

## Definition of done
The shared organization model, API, manager UI, migration, tests, and wiki documentation are complete without creating parallel customer/vendor systems.