# Slice 008: PWA Installation and Mobile Foundation

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Steering inheritance
This slice inherits [Shared Slice Steering](STEERING.md). Codex must read the master plan, shared steering, this slice, `docs/layout/000-layout-direction.md`, and any approved UI-006 specification before changing the application shell.

## Goal
Make the proven online application safely installable as a PWA without creating a separate mobile frontend.

## Dependencies
Requires Slices 001 through 007. Any application-shell, navigation, responsive-layout, or technician-mobile work also requires the approved UI-006 specification.

## Scope
- Manifest, icons, install metadata, production-safe service worker, standalone launch, deep links, update handling, network-error experience, safe static caching, authentication/logout validation, and mobile shell validation.
- Validate Android, iPhone/iPad home-screen behavior, and desktop installation.
- Preserve desktop manager workflows and technician permissions.

## UI steering
- This slice owns installability and mobile-shell reliability, not a broad UI redesign.
- Implement approved UI shell requirements only where they are necessary for standalone PWA behavior and have been assigned to this slice.
- Do not use PWA work as permission to rebuild navigation, work-order pages, operations workbenches, or technician workflows.
- Preserve safe areas, keyboard behavior, touch targets, route recovery, deep links, role boundaries, and account/tenant switching behavior.

## Out of scope
- Full offline work-order editing
- Background data synchronization
- Push notifications
- GPS/background tracking
- Native app packaging
- Broad application-shell, navigation, workbench, or workflow redesign

## Acceptance criteria
- Production build is installable where supported.
- Standalone launch, authentication, logout, updates, deep links, and recovery from network loss work safely.
- No cross-user or cross-tenant data is exposed through caches.
- Approved responsive and mobile-shell requirements are preserved where applicable.
- Tests, deployment documentation, wiki, and screenshots are updated.

## Guardrail
Do not combine offline business-data synchronization, a separate mobile frontend, or broad workflow redesign into this slice.
