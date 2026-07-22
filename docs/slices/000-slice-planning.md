# Slice Planning

## Purpose
This folder is the canonical planning location for implementation slices.

A slice is the smallest complete business capability that proves part of the architecture and creates a dependable foundation for the next slice.

## Status legend
- **Aligned:** Kevin agreed with the slice at a high level.
- **Proposed:** Reasonable next slice, but not yet explicitly confirmed by Kevin.
- **Planning:** Design work only; do not change production behavior yet.

## Current sequence
1. [001 Organizations](001-organizations.md) — Aligned
2. [002 Customer Service Locations](002-customer-service-locations.md) — Aligned
3. [003 People and Contact Roles](003-people-and-contact-roles.md) — Aligned
4. [004 Equipment Types and Customer Equipment](004-equipment-types-and-customer-equipment.md) — Aligned
5. [005 Identity, Workforce Access, and Authorization Alignment](005-workforce-access-and-technician-availability.md) — Proposed parent scope
   - [005-01 Person and User Account Linkage](005-01-person-user-account-linkage.md)
   - [005-02 Authorization Role Alignment](005-02-authorization-role-alignment.md)
   - [005-03 Workforce Profile and Technician Eligibility](005-03-workforce-profile-and-technician-eligibility.md)
   - [005-04 Legacy Employee and Technician Migration](005-04-legacy-employee-technician-migration.md)
6. [006 Work Order Intake](006-work-order-intake.md) — Proposed
7. [007 Basic Scheduling Board](007-basic-scheduling-board.md) — Proposed
8. [008 PWA Installation and Mobile Foundation](008-pwa-installation-mobile-foundation.md) — Proposed
9. [009 Ticket Quick-Add](009-ticket-quick-add.md) — Proposed

## Identity decision
- Person is the shared human identity.
- Employee and Technician are roles/profiles attached to a Person.
- A login/user account is linked to a Person when system access is required.
- Authentication remains responsible for sign-in and account security.
- Authorization roles and permissions remain separate from descriptive Person roles.
- Workforce eligibility does not automatically grant system access.
- The system must not create separate Person and Employee records for the same individual.

## Tracer bullets
- Customer Organization -> Service Location -> Equipment -> Work Order -> Backlog
- Person -> Optional User Account -> Authorization and Workforce Eligibility
- Backlog Work Order -> Eligible Technician Person and Time Assignment -> Schedule Block
- Proven online workflow -> Installable PWA shell -> Reliable mobile launch and updates

## Required guardrails for every slice
1. Audit the current implementation before changing code; this is not a greenfield project.
2. Reuse existing models, migrations, APIs, components, permissions, routes, and tests.
3. Implement only missing or incorrect behavior required by the current slice.
4. Preserve tenant isolation, existing data, and working desktop, mobile, manager, dispatcher, and technician workflows.
5. Do not create parallel systems or duplicate identity records.
6. Do not pull dependencies from later slices into the current slice.
7. Add focused backend, frontend, and end-to-end tests where applicable.
8. Run relevant build, test, migration, and validation commands.
9. Update the wiki and screenshots when UI behavior changes.
10. Keep each branch, commit, and PR limited to one slice.
11. Finish and review a slice before beginning the next unless a documented blocker requires otherwise.
12. Parent scopes with child slices are steering documents only and must not be implemented in one Codex run.

## Layout planning dependency
Application-shell and navigation changes are governed by `docs/layout/000-layout-direction.md`.

Do not perform a broad production navigation redesign until static HTML wireframes are created and reviewed.

## Legacy planning documents
The former top-level `slices/` documents remain historical/supporting references during transition. New planning and future edits belong under `docs/slices/`.