# Slice Planning

## Purpose
This folder is the canonical planning location for implementation slices.

A parent slice defines a complete business or planning outcome. A child slice is the smallest independently reviewable, testable, and reversible unit that advances that outcome.

All slices inherit [Shared Slice Steering](STEERING.md). Every Codex run must target one child only and read the master plan, shared steering, target child, parent scope, and any applicable approved UI specification.

## Status legend
- **Aligned:** Kevin agreed with the parent outcome at a high level.
- **Proposed:** Reasonable scope, not yet explicitly confirmed.
- **Planning:** Design or audit work only; no production behavior changes.

## Immediate UI wireframe planning track
[UI-000 User Interface Redesign Wireframe Plan](ui-000-ui-redesign-wireframe-plan.md) — Planning parent

1. [UI-001 Current UI and Workflow Audit](ui-001-current-ui-workflow-audit.md) — Planning parent
   - [UI-001-01 Route, Role, and Permission Inventory](ui-001-01-route-role-permission-inventory.md)
   - [UI-001-02 Workflow and Usability Audit](ui-001-02-workflow-usability-audit.md)
   - [UI-001-03 Findings and Preservation Baseline](ui-001-03-findings-preservation-baseline.md)
2. [UI-002 Information Architecture and Application Shell](ui-002-information-architecture-and-application-shell-wireframes.md) — Planning parent
   - [UI-002-01 Information Architecture](ui-002-01-information-architecture.md)
   - [UI-002-02 Desktop and Tablet Shell Wireframes](ui-002-02-desktop-tablet-shell-wireframes.md)
   - [UI-002-03 Manager Mobile Shell Wireframes](ui-002-03-manager-mobile-shell-wireframes.md)
3. [UI-003 Work Order Workspace Wireframes](ui-003-work-order-workspace-wireframes.md) — Planning parent
   - [UI-003-01 Work Order Intake Wireframes](ui-003-01-work-order-intake-wireframes.md)
   - [UI-003-02 Work Order Detail and Edit Wireframes](ui-003-02-work-order-detail-edit-wireframes.md)
   - [UI-003-03 Work Order Responsive and State Wireframes](ui-003-03-work-order-responsive-state-wireframes.md)
4. [UI-004 Operations Workbench Wireframes](ui-004-operations-workbench-wireframes.md) — Planning parent
   - [UI-004-01 Dispatch and Scheduling Workbench](ui-004-01-dispatch-scheduling-workbench.md)
   - [UI-004-02 Time Approval Workbench](ui-004-02-time-approval-workbench.md)
   - [UI-004-03 Parts and Purchasing Workbenches](ui-004-03-parts-purchasing-workbenches.md)
   - [UI-004-04 Shared Queue Patterns](ui-004-04-shared-queue-patterns.md)
5. [UI-005 Technician Mobile Workflow](ui-005-technician-mobile-wireframes.md) — Planning parent
   - [UI-005-01 Queue and Pre-Work Context](ui-005-01-queue-prework-context.md)
   - [UI-005-02 Active Work and Time Capture](ui-005-02-active-work-time-capture.md)
   - [UI-005-03 Work Capture, Blockers, and Completion](ui-005-03-work-capture-completion.md)
   - [UI-005-04 Error, Session, and Accessibility States](ui-005-04-error-session-accessibility.md)
6. [UI-006 Validation and Approved UI Specification](ui-006-wireframe-validation-and-approved-ui-spec.md) — Planning parent
   - [UI-006-01 Office Role Task Validation](ui-006-01-office-role-task-validation.md)
   - [UI-006-02 Technician Mobile Task Validation](ui-006-02-technician-mobile-task-validation.md)
   - [UI-006-03 Approved UI Specification and Production Plan](ui-006-03-approved-ui-spec-production-plan.md)

These children are planning-only. Broad production shell, navigation, page anatomy, workbench, work-order workspace, and technician-mobile redesign remains blocked until UI-006-03 is approved.

## Business-capability sequence
1. [001 Organizations](001-organizations.md) — Aligned parent
   - [001-01 Organization Core and Roles](001-01-organization-core-roles.md)
   - [001-02 Organization Quick-Create](001-02-organization-quick-create.md)
2. [002 Customer Service Locations](002-customer-service-locations.md) — Aligned parent
   - [002-01 Service Location Core](002-01-service-location-core.md)
   - [002-02 Service Location Quick-Create](002-02-service-location-quick-create.md)
3. [003 People and Contact Roles](003-people-and-contact-roles.md) — Aligned parent
   - [003-01 Person Core](003-01-person-core.md)
   - [003-02 Saved Contact Roles](003-02-saved-contact-roles.md)
   - [003-03 Person Quick-Create](003-03-person-quick-create.md)
4. [004 Equipment Types and Customer Equipment](004-equipment-types-and-customer-equipment.md) — Aligned parent
   - [004-01 Equipment Types](004-01-equipment-types.md)
   - [004-02 Customer Equipment](004-02-customer-equipment.md)
   - [004-03 Customer Equipment Quick-Create](004-03-customer-equipment-quick-create.md)
5. [005 Identity, Workforce Access, and Authorization Alignment](005-workforce-access-and-technician-availability.md) — Aligned parent
   - [005-01 Person and User Account Linkage](005-01-person-user-account-linkage.md)
   - [005-02 Authorization Model and Backend Enforcement](005-02-authorization-role-alignment.md)
   - [005-03 Frontend Authorization and Access Administration](005-03-frontend-authorization-access-administration.md)
   - [005-04 Workforce Profile and Technician Eligibility](005-04-workforce-profile-technician-eligibility.md)
   - [005-05 Legacy Workforce Inventory and Dry Run](005-05-legacy-workforce-inventory-dry-run.md)
   - [005-06 Legacy Workforce Migration and Cutover](005-06-legacy-workforce-migration-cutover.md)
6. [006 Work Order Intake and Backlog](006-work-order-intake.md) — Aligned parent
   - [006-01 Work Order Core](006-01-work-order-core.md)
   - [006-02 Organization and Location Quick-Create Integration](006-02-organization-location-quick-create-integration.md)
   - [006-03 Work Order Equipment Assignment](006-03-work-order-equipment-assignment.md)
   - [006-04 Equipment Quick-Create Integration](006-04-equipment-quick-create-integration.md)
   - [006-05 Work Order Contact Assignment](006-05-work-order-contact-assignment.md)
   - [006-06 Person Quick-Create Integration](006-06-person-quick-create-integration.md)
   - [006-07 Work Order Backlog](006-07-work-order-backlog.md)
7. [007 Assignment, Scheduling, and Dispatch](007-basic-scheduling-board.md) — Aligned parent
   - [007-01 Technician Assignment](007-01-technician-assignment.md)
   - [007-02 Schedule Time Block](007-02-schedule-time-block.md)
   - [007-03 Dispatch Backlog and Board](007-03-dispatch-backlog-and-board.md)
   - [007-04 Technician Work Queue](007-04-technician-work-queue.md)
8. [008 PWA Installation and Mobile Foundation](008-pwa-installation-mobile-foundation.md) — Proposed parent
   - [008-01 Manifest, Icons, and Installability](008-01-manifest-icons-installability.md)
   - [008-02 Service Worker and Safe Static Caching](008-02-service-worker-static-caching.md)
   - [008-03 Updates, Deep Links, and Network Recovery](008-03-updates-deep-links-network-recovery.md)
   - [008-04 Authentication and Cross-Account Safety](008-04-authentication-cross-account-safety.md)
   - [008-05 Standalone Mobile Shell Validation](008-05-standalone-mobile-shell-validation.md)
9. [009 Quick-Add Integration and Consistency](009-ticket-quick-add.md) — Proposed parent
   - [009-01 Quick-Add Lifecycle Contract Audit](009-01-quick-add-lifecycle-audit.md)
   - [009-02 Shared Quick-Add Infrastructure](009-02-shared-quick-add-infrastructure.md)
   - [009-03 Quick-Add Regression and Accessibility](009-03-quick-add-regression-accessibility.md)

## Architecture decisions
- Person is the shared human identity.
- Employee and Technician are roles or workforce profiles attached to Person.
- Authentication, authorization, descriptive roles, and workforce eligibility remain separate.
- Quick-create capability belongs to its master-data child; calling-workflow integration belongs to the workflow child.
- Migration inventory and dry run occur before migration cutover.
- Parent scopes are never executable Codex tasks.

## Tracer bullets
- Organization -> Service Location -> Customer Equipment -> Work Order -> Backlog
- Person -> Optional User Account -> Authorization and Workforce Eligibility
- Backlog Work Order -> Technician Assignment -> Schedule Block -> Technician Queue
- Proven Online Application -> Installable PWA -> Safe Launch, Updates, and Recovery

## Layout dependency
Application-shell and navigation work is governed by `docs/layout/000-layout-direction.md` and the UI planning track.

## Canonical planning location
- `docs/slices/` is the only active slice-planning tree.
- Do not create or restore a top-level `slices/` directory.
- Update links when plans are renamed or divided.
- Git history preserves superseded versions.
