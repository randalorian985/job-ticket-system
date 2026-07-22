# Slice 005-01: Person and User Account Linkage

## Status
Proposed; child slice of Slice 005.

## Goal
Link the existing authentication user account to the centralized Person identity without replacing the working authentication system.

## Dependencies
Requires Slice 003.

## Scope
- Audit existing application users, employee records, technician records, tenant membership, and person/contact records.
- Add or confirm an optional one-to-one link between Person and the application user account within a tenant.
- Provide a controlled way to link an existing user to an existing Person.
- Provide a controlled way to create application access for an existing Person when authorized.
- Allow login access to be disabled or unlinked without deleting the Person.
- Preserve password hashes, MFA, lockout, external-login, cookie, token, and password-reset behavior.
- Detect and report duplicate or ambiguous existing links rather than guessing.

## Business rules
- Person is the human identity; the user account is the authentication identity.
- A Person does not require a login account.
- A login account must not create a duplicate Person when a matching Person already exists.
- Removing access must not remove contact information, workforce history, assignments, labor, or audit records.
- The link must be tenant-safe and auditable.

## Acceptance criteria
- An existing user can be linked to the correct Person.
- An authorized administrator can create access for an existing Person without creating another Person.
- Disabling access prevents login while retaining the Person and history.
- Ambiguous duplicate records are surfaced for review.
- Existing authentication flows continue to work.
- Tests cover tenant boundaries, create/link/unlink, disabled access, and duplicate handling.

## Guardrail
Do not redesign permissions, workforce eligibility, scheduling, or ASP.NET Identity internals in this slice.