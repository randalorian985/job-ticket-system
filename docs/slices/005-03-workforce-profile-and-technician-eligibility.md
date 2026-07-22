# Slice 005-03: Workforce Profile and Technician Eligibility

## Status
Proposed; child slice of Slice 005.

## Goal
Add workforce-specific profile and eligibility behavior to People without creating a separate Employee identity.

## Dependencies
Requires Slice 003. May follow Slice 005-01 when user linkage is needed by the existing UI.

## Scope
- Audit existing employee, technician, availability, assignment, and labor settings.
- Store Employee and Technician as roles or profiles attached to Person.
- Maintain workforce active/inactive status independently of Person active status and login access.
- Maintain technician eligibility, scheduling visibility, and basic working-hours or availability data already required by the current architecture.
- Allow workforce records that do not have application access.
- Prevent inactive or ineligible technicians from receiving new assignments while preserving history.
- Update technician selectors and workforce screens to reference Person.

## Business rules
- Person is the identity; workforce profile is an extension.
- Employee status and technician eligibility are separate.
- A person may be an employee without being a technician.
- A technician may be schedulable without having a login when business workflow requires it.
- Deactivation must preserve historical assignments, labor, time entries, and schedule records.
- Scheduling eligibility does not grant application permission.

## Acceptance criteria
- Eligible technician People appear in later assignment and scheduling selectors.
- Inactive or ineligible People cannot receive new work.
- Workforce status, login access, Person status, and permissions can change independently.
- Existing historical records remain associated with the correct Person.
- Tests cover eligibility, deactivation, no-login technicians, tenant isolation, and selector behavior.

## Guardrail
Do not implement the scheduling board, work-order assignment workflow, or legacy record merge in this slice.