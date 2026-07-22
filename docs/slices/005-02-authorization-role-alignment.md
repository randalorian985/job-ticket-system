# Slice 005-02: Authorization Role Alignment

## Status
Proposed; child slice of Slice 005.

## Goal
Separate descriptive Person roles from application authorization and align existing access checks with the centralized Person model.

## Dependencies
Requires Slice 005-01.

## Scope
- Audit existing ASP.NET Identity roles, claims, policies, route guards, API authorization checks, frontend visibility rules, and tenant checks.
- Define the canonical authorization roles or permission sets used by the application, including Admin, Manager, Dispatcher, Technician, Parts Manager, Billing, and read-only roles where they already exist.
- Ensure descriptive Person roles such as Employee, Technician, Billing Contact, or Service Contact do not automatically grant application permissions.
- Link authorization assignments to the user account while allowing the UI to display the related Person.
- Replace authorization checks that incorrectly depend on a legacy Employee entity.
- Preserve assigned-ticket restrictions and manager/admin boundaries.
- Preserve current authentication technology and tenant isolation.

## Business rules
- Authentication answers who signed in.
- Authorization answers what the user account may do.
- Person roles describe business relationships and workforce capabilities.
- A Technician Person without a user account has no application access.
- A user account with Technician authorization must still obey assignment and tenant restrictions.
- Removing a descriptive role must not silently remove permissions, and changing permissions must not rewrite Person roles without an explicit workflow.

## Acceptance criteria
- Existing protected routes and APIs use the canonical authorization model.
- Person roles do not grant access by themselves.
- User-account permissions can be reviewed and changed independently of Person roles.
- Technician, manager, dispatcher, parts, and billing restrictions remain correct.
- Unauthorized UI controls are hidden, but server-side authorization remains authoritative.
- Tests cover all major roles, cross-tenant access, assigned-ticket restrictions, and denied operations.

## Guardrail
Do not migrate legacy employee data, redesign authentication internals, or implement scheduling in this slice.