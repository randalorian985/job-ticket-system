# Slice Planning

## Purpose
This folder is the canonical planning location for implementation slices.

A slice is the smallest complete business capability that proves part of the architecture and creates a dependable foundation for the next slice.

All parent and child slices inherit [Shared Slice Steering](STEERING.md). Every Codex run must read the master plan, shared steering, the target child slice, its parent scope, and any applicable approved UI specification before changing code.

## Status legend
- **Aligned:** Kevin agreed with the slice at a high level.
- **Proposed:** Reasonable next slice, but not yet explicitly confirmed by Kevin.
- **Planning:** Design work only; do not change production behavior yet.

## Immediate UI wireframe planning track
The current interface is confusing and the application shell does not scale cleanly. Start this planning track now, before any broad production UI redesign.

[UI-000 User Interface Redesign Wireframe Plan](ui-000-ui-redesign-wireframe-plan.md) — Planning parent scope

1. [UI-001 Current UI and Workflow Audit](ui-001-current-ui-workflow-audit.md)
2. [UI-002 Information Architecture and Application Shell Wireframes](ui-002-information-architecture-and-application-shell-wireframes.md)
3. [UI-003 Work Order Intake and Detail Workspace Wireframes](ui-003-work-order-workspace-wireframes.md)
4. [UI-004 Dispatch, Scheduling, and Review Workbench Wireframes](ui-004-operations-workbench-wireframes.md)
5. [UI-005 Technician Mobile Workflow Wireframes](ui-005-technician-mobile-wireframes.md)
6. [UI-006 Wireframe Validation and Approved UI Specification](ui-006-wireframe-validation-and-approved-ui-spec.md)

These are planning slices, not production implementation slices. They may proceed while business-domain slices are being planned, but production shell, navigation, page anatomy, workbenches, work-order workspace, and broad technician-mobile redesign must wait until UI-006 is approved.

Business-capability slices may still make narrowly scoped UI changes required to complete their capability. Before UI-006 approval, those changes must use existing patterns and must not establish a competing broad redesign. After UI-006 approval, production UI changes must conform to the approved specification unless a reviewed exception is documented.

## Current business-capability sequence
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
1. Follow [Shared Slice Steering](STEERING.md).
2. Audit the current implementation before changing code; this is not a greenfield project.
3. Reuse existing models, migrations, APIs, components, permissions, routes, and tests.
4. Implement only missing or incorrect behavior required by the current slice.
5. Preserve tenant isolation, existing data, and working desktop, mobile, manager, dispatcher, and technician workflows.
6. Do not create parallel systems or duplicate identity records.
7. Do not pull dependencies from later slices into the current slice.
8. Add focused backend, frontend, and end-to-end tests where applicable.
9. Run relevant build, test, migration, and validation commands.
10. Update the wiki and screenshots when UI behavior changes.
11. Keep each branch, commit, and PR limited to one slice.
12. Finish and review a slice before beginning the next unless a documented blocker requires otherwise.
13. Parent scopes with child slices are steering documents only and must not be implemented in one Codex run.
14. Reusable quick-create capability and calling-workflow integration must stay in their assigned slices; do not defer all quick-add behavior to Slice 009.
15. UI wireframe slices must not change production routes, components, business behavior, permissions, APIs, or database structures.

## Layout planning dependency
Application-shell and navigation changes are governed by `docs/layout/000-layout-direction.md` and the UI planning track.

Do not perform a broad production navigation or workspace redesign until UI-006 is approved.

## Canonical planning location
- `docs/slices/` is the only active implementation-planning tree.
- Do not create or restore a top-level `slices/` directory.
- Update links when plans are renamed or consolidated instead of keeping duplicate compatibility copies.
- Keep a redirect only when a live repository or external dependency still requires the old path.
- Git history preserves superseded planning documents and is the archive for removed versions.
