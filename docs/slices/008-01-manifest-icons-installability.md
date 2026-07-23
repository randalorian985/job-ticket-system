# Slice 008-01: Manifest, Icons, and Installability

## Status
Proposed child of Slice 008.

## Goal
Make the production build meet supported browser installability requirements without adding a service worker caching strategy yet.

## Dependencies
Requires the proven online application and reviewed deployment configuration.

## Scope
- Audit current manifest, icons, metadata, Vite configuration, deployment headers, and partial PWA code.
- Add or repair the web app manifest, application name, display mode, theme/background metadata, start URL, scope, and required icon assets.
- Validate production output and supported Android, desktop Chromium, and iPhone/iPad home-screen metadata behavior.
- Preserve current routes, authentication entry, branding, and desktop behavior.
- Document platform limitations and installation steps.

## Acceptance criteria
- Production installability checks pass where supported.
- Installed launch uses the correct name, icon, theme, scope, and start route.
- Existing browser launch and route behavior do not regress.
- Build validation, platform documentation, tests where practical, wiki, and screenshots are complete.

## Guardrail
Do not add caching, update activation, offline business behavior, auth/session changes, or broad responsive redesign in this child.
