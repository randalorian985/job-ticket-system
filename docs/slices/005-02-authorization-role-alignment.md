# Slice 005-02: Authorization Model and Backend Enforcement

## Status
Aligned child of Slice 005.

## Goal
Define and enforce one canonical backend authorization model independent of descriptive Person roles.

## Dependencies
Requires Slice 005-01.

## Scope
- Audit ASP.NET Identity roles, claims, policies, API authorization attributes, service-level checks, assigned-ticket restrictions, and tenant enforcement.
- Document the canonical application roles or permission sets already required by the system.
- Ensure descriptive Person roles and workforce eligibility do not grant application permissions.
- Replace backend checks that incorrectly depend on a legacy Employee entity.
- Preserve authentication technology, tenant isolation, manager/admin boundaries, technician assigned-ticket restrictions, and server-side authority.
- Add a backend authorization matrix and focused policy/API tests.

## Acceptance criteria
- Protected APIs and backend operations use the canonical authorization model.
- Person roles and workforce eligibility do not grant access.
- Major allowed and denied operations are covered for Admin, Manager, Dispatcher, Technician, Parts, Billing, and existing read-only roles where applicable.
- Cross-tenant and assigned-ticket restrictions remain correct.
- Existing authentication behavior does not regress.

## Guardrail
Do not redesign frontend route guards, access-administration screens, legacy workforce migration, authentication internals, or scheduling in this child.
