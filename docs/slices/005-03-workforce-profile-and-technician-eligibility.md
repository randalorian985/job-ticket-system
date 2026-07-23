# Slice 005-03: Frontend Authorization and Access Administration

## Status
Aligned child of Slice 005.

## Goal
Align frontend route protection, control visibility, and access-administration workflows with the canonical backend authorization model.

## Dependencies
Requires Slice 005-02.

## Scope
- Audit frontend route guards, role checks, navigation visibility, action visibility, unauthorized states, and user-access administration screens.
- Consume the canonical roles or permissions defined by Slice 005-02.
- Remove frontend checks that incorrectly depend on descriptive Person or legacy Employee roles.
- Ensure hidden controls do not replace server-side enforcement.
- Provide authorized access review and assignment using existing administration patterns.
- Preserve technician assigned-ticket visibility and manager/admin boundaries.
- Add focused route, component, and permission-state tests.

## Acceptance criteria
- Authorized users can reach expected routes and actions.
- Unauthorized routes and controls behave consistently without exposing restricted data.
- Access assignments can be reviewed and changed independently of Person roles and workforce eligibility.
- Frontend behavior agrees with backend enforcement for major roles.
- Tenant boundaries and existing authentication flows remain correct.

## Guardrail
Do not implement workforce eligibility, legacy migration, broad administration redesign, or backend policy changes beyond defects required to consume Slice 005-02.
