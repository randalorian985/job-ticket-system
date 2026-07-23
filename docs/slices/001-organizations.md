# Slice 001: Organizations

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Provide one canonical Organization model that supports multiple business roles and reusable creation without duplicate organization systems.

## Required child sequence
1. [001-01 Organization Core and Roles](001-01-organization-core-roles.md)
2. [001-02 Organization Quick-Create](001-02-organization-quick-create.md)

Each child must be implemented, validated, and reviewed independently.

## Shared decisions
- One Organization may hold Customer, Vendor, Equipment Manufacturer, and Part Manufacturer roles.
- Billing Party remains a work-order relationship, not a required permanent role.
- Existing customer, vendor, and manufacturer records must be audited and preserved or migrated safely.
- Quick-create reuses the canonical Organization capability; it is not a second form or API system.

## Parent acceptance criteria
- Both children are complete.
- Existing organization-related records remain usable.
- Duplicate organization creation is reduced through shared identity and warnings.
- Later location and work-order slices can depend on one Organization model and one quick-create contract.

## Guardrail
Do not send this parent scope to Codex. Do not include locations, people, equipment, work orders, or scheduling beyond compatibility required by the child being implemented.
