# Slice Planning

## Purpose
This folder is the canonical planning location for implementation slices.

A slice is the smallest complete business capability that proves part of the architecture and creates a dependable foundation for the next slice.

## Status legend
- **Aligned:** Kevin agreed with the slice at a high level.
- **Proposed:** Reasonable next slice, but not yet explicitly confirmed by Kevin.
- **Planning:** Design work only; do not change production behavior yet.

## Current sequence
1. [001 Organizations](001-organizations.md) — Aligned; owns Organization quick-create
2. [002 Customer Service Locations](002-customer-service-locations.md) — Aligned; owns Service Location quick-create
3. [003 People and Contact Roles](003-people-and-contact-roles.md) — Aligned; owns Person quick-create
4. [004 Equipment Types and Customer Equipment](004-equipment-types-and-customer-equipment.md) — Aligned; owns Customer Equipment quick-create
5. [005 Identity, Workforce Access, and Authorization Alignment](005-workforce-access-and-technician-availability.md) — Aligned parent scope
   - [005-01 Person and User Account Linkage](005-01-person-user-account-linkage.md)
   - [005-02 Authorization Role Alignment](005-02-authorization-role-alignment.md)
   - [005-03 Workforce Profile and Technician Eligibility](005-03-workforce-profile-and-technician-eligibility.md)
   - [005-04 Legacy Employee and Technician Migration](005-04-legacy-employee-technician-migration.md)
6. [006 Work Order Intake and Backlog](006-work-order-intake.md) — Aligned parent scope
   - [006-01 Work Order Core](006-01-work-order-core.md) — integrates Organization and Service Location quick-create
   - [006-02 Work Order Equipment](006-02-work-order-equipment.md) — integrates Customer Equipment quick-create
   - [006-03 Work Order Contacts](006-03-work-order-contacts.md) — integrates Person quick-create
   - [006-04 Work Order Backlog](006-04-work-order-backlog.md)
7. [007 Assignment, Scheduling, and Dispatch](007-basic-scheduling-board.md) — Aligned parent scope
   - [007-01 Technician Assignment](007-01-technician-assignment.md)
   - [007-02 Schedule Time Block](007-02-schedule-time-block.md)
   - [007-03 Dispatch Backlog and Board](007-03-dispatch-backlog-and-board.md)
   - [007-04 Technician Work Queue](007-04-technician-work-queue.md)
8. [008 PWA Installation and Mobile Foundation](008-pwa-installation-mobile-foundation.md) — Proposed
9. [009 Quick-Add Integration and Consistency](009-ticket-quick-add.md) — Proposed final hardening pass

## Identity decision
- Person is the shared human identity.
- Employee and Technician are roles/profiles attached to a Person.
- A login/user account is linked to a Person when system access is required.
- Authentication remains responsible for sign-in and account security.
- Authorization roles and permissions remain separate from descriptive Person roles.
- Workforce eligibility does not automatically grant system access.
- The system must not create separate Person and Employee records for the same individual.

## Quick-add decision
- Quick-create belongs to the master-data slice that owns the record.
- Work-order child slices integrate those reusable create flows into the appropriate selectors.
- Quick-create must preserve unsaved calling-workflow state, prefill known context, return a controlled result, and automatically select the new record after successful save.
- Create permissions, tenant isolation, validation, and duplicate warnings apply equally inside and outside quick-add.
- Slice 009 is a consistency and hardening pass; it must not rebuild the underlying create flows.

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
13. Reusable quick-create capability and calling-workflow integration must stay in their assigned slices; do not defer all quick-add behavior to Slice 009.

## Layout planning dependency
Application-shell and navigation changes are governed by `docs/layout/000-layout-direction.md`.

Do not perform a broad production navigation redesign until static HTML wireframes are created and reviewed.

## Legacy planning documents
The former top-level `slices/` documents remain historical/supporting references during transition. New planning and future edits belong under `docs/slices/`.