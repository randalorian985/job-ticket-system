# UI-000: User Interface Redesign Wireframe Plan

## Status
Planning parent scope only. Do not implement this entire document in one Codex run.

## Steering inheritance
This parent and all UI child slices inherit [Shared Slice Steering](STEERING.md). Each Codex run must target one UI child only and must read the master plan, shared steering, this parent scope, the target child, `docs/layout/000-layout-direction.md`, and all approved outputs from earlier UI children.

## Problem
The current interface is confusing to users. The manager shell presents many destinations through a large header, top-level links, grouped dropdown menus, and a separate mobile screen picker. Users must understand the repository's feature grouping before they can find the work they need to perform.

The redesign must improve task discovery, reduce unnecessary navigation decisions, and place actionable work closer to the top of each screen without changing business rules during planning.

## Goal
Produce reviewed static wireframes and an approved UI specification for manager, dispatcher, reviewer, administrator, and technician workflows before broad production UI implementation begins.

## Required child sequence
1. [UI-001 Current UI and Workflow Audit](ui-001-current-ui-workflow-audit.md)
2. [UI-002 Information Architecture and Application Shell Wireframes](ui-002-information-architecture-and-application-shell-wireframes.md)
3. [UI-003 Work Order Intake and Detail Workspace Wireframes](ui-003-work-order-workspace-wireframes.md)
4. [UI-004 Dispatch, Scheduling, and Review Workbench Wireframes](ui-004-operations-workbench-wireframes.md)
5. [UI-005 Technician Mobile Workflow Wireframes](ui-005-technician-mobile-wireframes.md)
6. [UI-006 Wireframe Validation and Approved UI Specification](ui-006-wireframe-validation-and-approved-ui-spec.md)

Each child must be reviewed before the next dependent child is treated as approved. Iteration is expected; approval does not require first-draft acceptance.

## Shared design principles
- Organize navigation around user tasks and operational domains, not implementation modules.
- Keep the user's current work and primary action obvious.
- Reduce competing actions, repeated headers, decorative spacing, and unnecessary scrolling.
- Prefer progressive disclosure over showing every control at once.
- Preserve full access to existing routes and capabilities appropriate to each role.
- Make status, ownership, blockers, and next actions visible without opening several screens.
- Use consistent page anatomy, action placement, filters, tables, forms, drawers, and dialogs.
- Support keyboard navigation, visible focus, readable contrast, touch targets, and semantic structure.
- Design desktop, tablet, and mobile intentionally; do not merely shrink desktop layouts.
- Treat static wireframes as disposable planning artifacts, not production components.

## Required artifacts
- Current-state route and workflow map.
- Current pain-point inventory tied to specific screens or tasks.
- Static HTML wireframes under `docs/layout/wireframes/`.
- Desktop, tablet, and mobile examples where applicable.
- Navigation and page-anatomy specification.
- Interaction notes for menus, tabs, drawers, dialogs, filters, empty states, validation, and destructive actions.
- Role and permission visibility matrix.
- Approval record listing accepted decisions, rejected alternatives, and deferred questions.
- Proposed production implementation sequence divided into small, reversible UI slices.

## Approval gates
- UI-001 must establish evidence before solution design begins.
- UI-002 through UI-005 must preserve every authorized capability and document unresolved workflow questions.
- UI-006 must validate real tasks for each role and record approved terminology, navigation, responsive behavior, accessibility, and interaction rules.
- Approval of a wireframe is approval of the documented workflow and interaction direction, not permission for one broad production rewrite.
- Production implementation must be split into separately reviewable slices after UI-006.

## Guardrails
- Do not modify production React components, CSS, routes, APIs, permissions, or data models in these slices.
- Do not remove a capability because it is difficult to place.
- Do not invent new business workflows merely to make a wireframe cleaner.
- Do not use generic dashboard cards as a substitute for a task-focused workflow.
- Do not approve a design based only on visual preference; validate findability and task completion.
- Do not implement the future application-shell or workspace slices until UI-006 is approved.

## Parent definition of done
The parent planning scope is complete when all child wireframe slices are reviewed, the approved direction is documented, and implementation is divided into small production UI slices with explicit migration, accessibility, responsive, validation, and regression boundaries.
