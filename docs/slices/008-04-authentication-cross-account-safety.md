# Slice 008-04: Authentication and Cross-Account Safety

## Status
Proposed child of Slice 008.

## Goal
Ensure installed-mode authentication, logout, expiration, and account or tenant switching do not expose stale state.

## Dependencies
Requires Slices 008-02 and 008-03.

## Scope
- Audit authentication bootstrap, logout, expired-session handling, storage, cache interaction, and account/tenant switching.
- Ensure installed launch reaches the correct authentication or authorized route.
- Clear or invalidate user-specific application state on logout.
- Prevent a different user or tenant on the same device from seeing stale data from the prior session.
- Preserve MFA, lockout, token, cookie, password-reset, and existing authorization behavior.
- Validate expired-session recovery from deep links and standalone mode.

## Acceptance criteria
- Login, logout, session expiration, and reauthentication work in installed mode.
- User and tenant switching cannot reveal prior-session data.
- Static caches and runtime state do not bypass route or API authorization.
- Existing browser authentication behavior does not regress.
- Focused security, integration, and browser tests plus documentation are complete.

## Guardrail
Do not redesign authentication architecture, permissions, navigation, or offline business-data behavior in this child.
