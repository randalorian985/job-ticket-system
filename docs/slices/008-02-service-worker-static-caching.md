# Slice 008-02: Service Worker and Safe Static Caching

## Status
Proposed child of Slice 008.

## Goal
Add a production-safe service worker that caches only approved static application assets.

## Dependencies
Requires Slice 008-01.

## Scope
- Audit existing service-worker, cache, Vite plugin, deployment, and asset-versioning behavior.
- Use the project's supported Vite integration rather than custom complexity where practical.
- Register a production service worker and cache only reviewed static assets.
- Exclude authenticated API responses, access tokens, tenant data, billing data, and uploaded files from broad caches.
- Provide a controlled offline/network-error shell when required static assets are unavailable.
- Document cache names, versioning, cleanup, and troubleshooting.

## Acceptance criteria
- Production output registers the expected service worker.
- Static assets support controlled launch behavior without exposing sensitive data.
- Obsolete caches are cleaned according to the documented version strategy.
- Browser, user, and tenant switching cannot reveal cached authenticated data.
- Focused tests, production validation, and documentation are complete.

## Guardrail
Do not implement update prompts, deep-link recovery, authentication redesign, offline work-order editing, or background synchronization in this child.
