# Slice 001-01: Organization Core and Roles

## Status
Aligned child of Slice 001.

## Goal
Create or repair the canonical Organization record, lifecycle, roles, search, and direct management workflow.

## Scope
- Audit current customer, vendor, and manufacturer models, migrations, APIs, screens, permissions, and references.
- Provide Organization list, create, view, edit, activate, and deactivate behavior.
- Support Customer, Vendor, Equipment Manufacturer, and Part Manufacturer roles.
- Allow several roles on one Organization without duplicate role rows or duplicate Organization records.
- Search by name and existing organization/account number.
- Preserve role-specific data and historical references.
- Enforce tenant isolation, validation, permissions, and duplicate warnings.

## Acceptance criteria
- One Organization can hold several roles and role changes do not duplicate it.
- Existing customer, vendor, and manufacturer workflows continue to resolve the correct Organization.
- Inactive Organizations remain historically readable but cannot be selected where current rules prohibit it.
- Search, permissions, tenant boundaries, migration handling, tests, and wiki documentation are complete.

## Guardrail
Do not implement reusable quick-create, service locations, people, equipment, work orders, or scheduling in this child.
