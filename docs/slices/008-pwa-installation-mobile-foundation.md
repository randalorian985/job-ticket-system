# Slice 008: PWA Installation and Mobile Foundation

## Status
Proposed parent steering scope only.

## Goal
Make the proven online application safely installable and reliable in standalone mode through separate installability, caching, lifecycle, security, and shell-validation children.

## Dependencies
Requires Slices 001 through 007. Any production shell or responsive-layout change also requires approved UI-006-03 direction.

## Required child sequence
1. [008-01 Manifest, Icons, and Installability](008-01-manifest-icons-installability.md)
2. [008-02 Service Worker and Safe Static Caching](008-02-service-worker-static-caching.md)
3. [008-03 Updates, Deep Links, and Network Recovery](008-03-updates-deep-links-network-recovery.md)
4. [008-04 Authentication and Cross-Account Safety](008-04-authentication-cross-account-safety.md)
5. [008-05 Standalone Mobile Shell Validation](008-05-standalone-mobile-shell-validation.md)

## Shared decisions
- The existing React application remains the only frontend.
- PWA work must not create offline business-data synchronization.
- Authenticated API responses and sensitive tenant data are not broadly cached.
- Broad navigation and workflow redesign remain outside Slice 008.

## Parent acceptance criteria
- All five children are complete.
- Supported platforms can install and launch the app safely.
- Updates, deep links, network failures, logout, account switching, and standalone layout behave reliably.
- No cache exposes data across users or tenants.

## Guardrail
Do not send this parent to Codex. Do not include push notifications, GPS, native packaging, background synchronization, full offline editing, or broad UI redesign.
