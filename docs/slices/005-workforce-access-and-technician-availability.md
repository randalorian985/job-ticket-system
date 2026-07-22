# Slice 005: Identity, Workforce Access, and Authorization Alignment

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Align the centralized Person model with authentication, authorization, workforce profiles, technician eligibility, and legacy employee data through small, reviewable child slices.

## Dependencies
Requires Slice 003 and the aligned master-data foundation.

## Required child sequence
1. [005-01 Person and User Account Linkage](005-01-person-user-account-linkage.md)
2. [005-02 Authorization Role Alignment](005-02-authorization-role-alignment.md)
3. [005-03 Workforce Profile and Technician Eligibility](005-03-workforce-profile-and-technician-eligibility.md)
4. [005-04 Legacy Employee and Technician Migration](005-04-legacy-employee-technician-migration.md)

Each child slice must be implemented, validated, and reviewed independently. Do not send Codex the entire parent scope as one implementation task.

## Architecture decision
- Person is the shared human identity.
- The application user account is the authentication identity.
- Authorization roles and permissions belong to the user account/security layer.
- Employee and Technician are Person roles or workforce profiles.
- Workforce eligibility does not grant application access.
- Application access does not create or replace a Person.
- Legacy Employee or Technician records must be reconciled into Person rather than preserved as a competing identity system.

## Existing-system rule
Audit all existing authentication, Identity, employee, technician, person, contact, role, permission, assignment, labor, time, availability, and schedule behavior before changing code. Preserve working ASP.NET Identity infrastructure unless a documented defect requires otherwise.

## Parent acceptance criteria
- User accounts link safely to People.
- Descriptive Person roles are separated from application permissions.
- Workforce and technician eligibility extend Person rather than creating another identity.
- Existing historical workforce data is migrated or explicitly reported as unresolved.
- Passwords, sign-in, MFA, lockout, tenant isolation, historical assignments, labor, and audit records remain correct.
- Work Order Intake and Scheduling can depend on one Person-based workforce model.

## Guardrail
Do not implement this parent slice in a single Codex run. Do not include work-order assignment, scheduling-board, application-shell, or PWA redesign.