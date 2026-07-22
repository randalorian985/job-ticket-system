# Slice 005: Workforce Access and Technician Availability

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Add workforce-specific access, scheduling eligibility, and availability behavior to People who already hold Employee or Technician roles from Slice 003.

## Dependencies
Requires Slice 003 and the aligned master-data foundation.

## Existing-system rule
Audit existing users, employees, technicians, roles, permissions, availability, assignments, and calendar data before changing code. Reuse the Person identity established in Slice 003 and do not create a separate employee directory.

## Scope
- Link an existing Person with an Employee role to an existing or new application user account when access is required.
- Maintain workforce active/inactive status without deleting the Person.
- Maintain technician eligibility and scheduling visibility.
- Maintain basic availability or working-hours data needed by later scheduling slices when already supported by the architecture.
- Preserve assigned-ticket restrictions and current login behavior.
- Keep descriptive saved roles separate from authorization permissions.
- Support workforce records that do not require login access.
- Preserve historical assignments, time records, and schedule history when access or eligibility changes.

## Business rules
- A Person is the identity; Employee and Technician are roles/profiles.
- A login account grants system access but does not replace the Person record.
- Removing login access must not remove the Person or historical work.
- Deactivating workforce eligibility must prevent new assignments while preserving prior assignments.
- Technician eligibility determines assignment and scheduling availability; it is not the same as general Employee status.
- Authorization roles such as Admin or Manager must follow the existing security model and are not inferred solely from descriptive Person roles.

## Acceptance criteria
- Existing Employee/Technician People can be made schedulable without duplicate identity records.
- Application access can be linked, changed, or removed independently of the Person record.
- Eligible technicians are available to later assignment and scheduling workflows.
- Ineligible or inactive technicians cannot receive new assignments.
- Historical records remain intact.
- Tenant isolation, permissions, tests, and wiki documentation remain correct.

## Guardrail
Do not implement work-order assignment or the scheduling board in this slice.