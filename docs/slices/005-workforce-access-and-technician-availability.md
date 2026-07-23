# Slice 005: Identity, Workforce Access, and Authorization Alignment

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Align Person identity with authentication, authorization, workforce eligibility, and legacy workforce data through independently reviewable children.

## Dependencies
Requires Slice 003-01. Saved contact roles are not an authorization dependency.

## Required child sequence
1. [005-01 Person and User Account Linkage](005-01-person-user-account-linkage.md)
2. [005-02 Authorization Model and Backend Enforcement](005-02-authorization-role-alignment.md)
3. [005-03 Frontend Authorization and Access Administration](005-03-workforce-profile-and-technician-eligibility.md)
4. [005-04 Workforce Profile and Technician Eligibility](005-04-legacy-employee-technician-migration.md)
5. [005-05 Legacy Workforce Inventory and Dry Run](005-05-legacy-workforce-inventory-dry-run.md)
6. [005-06 Legacy Workforce Migration and Cutover](005-06-legacy-workforce-migration-cutover.md)

Each child must be implemented, validated, and reviewed independently.

## Architecture decisions
- Person is the human identity; the application user account is the authentication identity.
- Authorization belongs to user-account security, not descriptive Person roles.
- Workforce profiles extend Person and may exist without application access.
- Migration discovery and dry run must complete before production cutover.
- Legacy creation paths are retired only after validation proves all dependent workflows use Person.

## UI steering
Narrow identity, authorization, and workforce screens may be repaired as required. Broad administration or application-shell redesign remains governed by the UI planning track.

## Parent acceptance criteria
- All six children are complete.
- User accounts link safely to People.
- Backend and frontend authorization use one canonical model.
- Workforce eligibility extends Person without granting access.
- Legacy workforce records are migrated or explicitly reported as unresolved.
- Authentication security, tenant isolation, assignments, labor, time, schedules, and audit history remain correct.

## Guardrail
Do not send this parent to Codex. Do not include work-order assignment, scheduling-board, broad administration UI, or PWA redesign.
