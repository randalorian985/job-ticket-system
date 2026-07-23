# Slice 005-04: Workforce Profile and Technician Eligibility

## Status
Aligned child of Slice 005.

## Goal
Add workforce status and technician eligibility to canonical People without creating a separate Employee identity.

## Dependencies
Requires Slices 003-01 and 005-02. May use Slice 005-01 linkage where existing screens require a related user account.

## Scope
- Audit employee, technician, availability, assignment, labor, and scheduling-selector behavior.
- Add or repair a workforce profile attached to Person.
- Maintain employment active/inactive status independently of Person active status and login access.
- Maintain technician eligibility and scheduling visibility.
- Preserve basic working-hours or availability data already required by current architecture.
- Allow schedulable workforce records without application access when business rules require it.
- Prevent inactive or ineligible technicians from receiving new assignments while preserving history.
- Update workforce screens and technician selectors to reference Person.

## Acceptance criteria
- Eligible technician People appear in later selectors.
- Inactive or ineligible People cannot receive new work.
- Workforce status, Person status, login access, and permissions change independently.
- Historical assignments, labor, time, and schedules remain associated with the correct Person.
- Tenant isolation and focused eligibility/deactivation tests are complete.

## Guardrail
Do not implement scheduling-board behavior, work-order assignment, legacy migration, or broad workforce UI redesign in this child.
