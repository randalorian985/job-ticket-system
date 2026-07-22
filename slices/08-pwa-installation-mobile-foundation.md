# Slice 08: PWA Installation and Mobile Foundation

## Goal
Make the existing React application installable as a Progressive Web App and establish a reliable mobile application shell after the core work-order and scheduling workflows are stable.

## Dependencies
Requires Slices 01 through 07. The PWA must wrap and preserve the proven organization, location, people, equipment, employee, work-order, and scheduling workflows rather than introducing a parallel mobile application.

## Existing-system rule
Audit the current React/Vite application shell, routing, authentication, responsive layout, caching behavior, build pipeline, deployment configuration, icons, and any existing manifest or service-worker code before making changes. Reuse supported infrastructure and remove conflicting partial PWA implementations instead of layering on a second approach.

## Scope
- Add or complete a valid web app manifest.
- Add the required application icons and install metadata.
- Add a production-safe service worker using the project's supported Vite approach.
- Support installation on compatible Android, Windows, macOS, and Chromium-based desktop browsers.
- Confirm iPhone and iPad home-screen behavior and document platform limitations.
- Ensure installed-app launch opens the correct authenticated application route.
- Preserve deep links and route refresh behavior.
- Add a clear, non-disruptive application-update flow when a new service-worker version is available.
- Provide resilient offline and network-error screens.
- Cache only safe static application assets in this slice.
- Verify the responsive application shell, navigation, viewport, safe areas, keyboard behavior, and touch targets.
- Ensure the installed app does not expose billing or manager-only data to technicians through caching or route mistakes.
- Update deployment and wiki documentation.

## Explicitly out of scope
- Full offline work-order editing.
- Background synchronization of ticket changes.
- Offline photo or file uploads.
- Push notifications.
- GPS tracking or background location.
- Native app-store packaging.
- Rebuilding the UI as a separate mobile frontend.
- Broad redesign of ticket, dispatch, or scheduling workflows.

Those capabilities require separate future slices after online technician workflows are proven.

## Security and data rules
- Do not cache authenticated API responses containing tenant or customer data unless an existing reviewed strategy already safely supports it.
- Do not store access tokens, sensitive ticket data, billing details, or technician-only data in broadly accessible caches.
- Logout must clear or invalidate application state appropriately.
- A user switching accounts or tenants on the same device must not see stale data from the prior session.
- Service-worker updates must not leave the application running mismatched frontend and backend versions longer than necessary.

## Mobile foundation requirements
- The application must launch without horizontal scrolling at supported mobile widths.
- Primary navigation must remain usable in standalone display mode.
- Browser-only controls must not be required to return to the main workspace.
- Fixed headers, bottom navigation, dialogs, drawers, and forms must respect device safe areas.
- Form fields must remain visible when the on-screen keyboard opens.
- Installation must not change desktop manager workflows.

## Acceptance criteria
- The production build generates a valid manifest and service worker.
- Browser installability checks pass where supported.
- The installed application launches in standalone mode with the correct name, icon, theme, and start route.
- Authentication, logout, deep links, and route refreshes work from the installed app.
- A network loss produces a controlled offline/error experience rather than a blank screen.
- Restoring the network allows the user to continue without reinstalling.
- A deployed update can be detected and activated through a clear user flow.
- Static asset caching does not expose cross-user or cross-tenant data.
- Work-order intake and scheduling remain functional on desktop and mobile.
- Android, iPhone home-screen, and desktop installation behavior are documented with screenshots.

## Tests and validation
- Run the existing frontend build and test suite.
- Add tests for manifest generation and service-worker registration where practical.
- Validate production output rather than relying only on the development server.
- Test fresh install, update, logout, expired session, deep link, hard refresh, offline launch, and network recovery.
- Run mobile viewport end-to-end checks for the application shell and critical routes.
- Use browser PWA/installability audits as supporting validation, not as the only validation.

## Codex instructions
1. Audit the existing implementation and deployment environment first.
2. Document any current PWA-related files before replacing or removing them.
3. Use the project's supported React/Vite tooling and avoid custom service-worker complexity when a maintained integration is available.
4. Keep this slice focused on installability, safe caching, updates, authentication behavior, and the mobile shell.
5. Do not implement offline business-data synchronization in this slice.
6. Preserve current routes and permissions.
7. Update the wiki with installation, update, troubleshooting, and platform-specific behavior.
8. Include screenshots of installed mobile and desktop states when possible.

## Definition of done
The production application is safely installable as a PWA, launches and updates reliably, preserves authentication and tenant boundaries, provides controlled network-failure behavior, passes relevant validation, and does not regress existing desktop or mobile workflows.