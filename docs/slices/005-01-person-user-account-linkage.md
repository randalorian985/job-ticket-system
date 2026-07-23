# Slice 005-01: Person and User Account Linkage

## Status
Aligned child of Slice 005.

## Goal
Link existing authentication accounts to canonical People without replacing the working authentication system.

## Dependencies
Requires Slice 003-01.

## Scope
- Audit application users, tenant membership, Person records, and existing user/person/employee links.
- Add or confirm an optional tenant-safe one-to-one Person/User link.
- Link an existing user to an existing Person.
- Create application access for an existing Person when authorized.
- Disable or unlink login access without deleting Person data.
- Preserve password hashes, MFA, lockout, external login, cookie, token, and reset behavior.
- Detect and report ambiguous or duplicate links rather than guessing.

## Acceptance criteria
- Existing users can be linked to the correct Person.
- Authorized administrators can create access without creating duplicate People.
- Disabling access preserves the Person and history.
- Ambiguous links are surfaced for review.
- Authentication flows, tenant isolation, auditability, and focused tests remain correct.

## Guardrail
Do not redesign authorization roles, frontend access administration, workforce eligibility, scheduling, or ASP.NET Identity internals in this child.
