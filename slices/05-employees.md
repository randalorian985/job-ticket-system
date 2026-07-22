# Slice 05: Employees

## Goal
Provide an employee capability that supports work-order assignment and scheduling without exposing payroll, internal cost, or billing-rate complexity in the MVP.

## Dependencies
No direct master-data dependency, but this slice must be complete before scheduling.

## Existing-system rule
Audit current users, employees, technicians, roles, assignments, and authorization. Reuse the existing identity integration and do not create a disconnected employee directory.

## Scope
- Employee list and detail/edit views.
- Create or link an employee to an application user according to existing architecture.
- Active/inactive status.
- Employee type or capability needed for technician assignment.
- Search and filtering.
- Preserve current Manager, Admin, Technician, Parts Manager, and other established authorization behavior.
- Ensure active assignable technicians appear in assignment selectors.

## Business rules
- Authentication roles and operational employee classifications must remain distinct concepts.
- Inactive employees remain on historical tickets and time entries but cannot receive new assignments.
- Employee pay rates, internal cost rates, and bill rates are out of MVP scope.
- This slice must not redesign the full permissions system.

## Acceptance criteria
- An active technician appears in work-order assignment selectors.
- An inactive technician remains visible historically but cannot be newly assigned.
- Employee records remain connected to the correct tenant and user identity.
- Existing login and authorization behavior continues to work.

## Tests
- Employee/user linking.
- Active assignment filtering.
- Historical-reference behavior.
- Authorization and tenant-boundary regression coverage.

## Definition of done
Employee models, APIs, manager UI, assignment lookup support, tests, and wiki documentation are complete and ready for work-order assignment and scheduling.