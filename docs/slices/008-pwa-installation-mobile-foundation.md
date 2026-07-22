# Slice 008: PWA Installation and Mobile Foundation

## Status
Proposed; not yet explicitly confirmed by Kevin.

## Goal
Make the proven online application safely installable as a PWA without creating a separate mobile frontend.

## Dependencies
Requires Slices 001 through 007 and reviewed layout direction where the application shell is affected.

## Scope
- Manifest, icons, install metadata, production-safe service worker, standalone launch, deep links, update handling, network-error experience, safe static caching, authentication/logout validation, and mobile shell validation.
- Validate Android, iPhone/iPad home-screen behavior, and desktop installation.
- Preserve desktop manager workflows and technician permissions.

## Out of scope
- Full offline work-order editing
- Background data synchronization
- Push notifications
- GPS/background tracking
- Native app packaging

## Acceptance criteria
- Production build is installable where supported.
- Standalone launch, authentication, logout, updates, deep links, and recovery from network loss work safely.
- No cross-user or cross-tenant data is exposed through caches.
- Tests, deployment documentation, wiki, and screenshots are updated.

## Guardrail
Do not combine offline business-data synchronization or broad workflow redesign into this slice.