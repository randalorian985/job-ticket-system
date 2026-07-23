# UI-006-02: Technician Mobile Task Validation

## Status
Planning child of UI-006.

## Goal
Validate the technician mobile concepts against real field tasks and device constraints.

## Dependencies
Requires completed UI-001, UI-002, UI-003, and UI-005.

## Scope
- Run task walkthroughs for finding assigned work, understanding job context, starting work, time-state changes, notes, blockers, parts, photos/files, completion review, failure, retry, and session recovery.
- Validate common mobile widths, orientation, safe areas, on-screen keyboard, one-hand use, touch, focus, screen-reader naming, and long-content behavior.
- Record missed context, wrong actions, false-success interpretation, permission exposure, and recovery failures.
- Return defects to the owning UI parent and rerun affected tasks.

## Required artifacts
- Technician task-validation matrix.
- Device/accessibility observation notes.
- Revised wireframe references and unresolved blocker list.

## Acceptance criteria
- Critical technician tasks complete without manager-oriented navigation.
- Time state, save state, blockers, and next action remain understandable.
- Critical mobile, accessibility, session, and permission failures are resolved or block approval.

## Guardrail
Do not validate office workbenches or change production UI in this child.
