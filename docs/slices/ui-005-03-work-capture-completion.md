# UI-005-03: Work Capture, Blockers, and Completion

## Status
Planning child of UI-005.

## Goal
Design technician notes, status updates, blockers, parts, photos/files, and completion review using current business rules.

## Dependencies
Requires UI-005-01 and UI-005-02.

## Scope
- Wireframe work notes and status updates.
- Wireframe blocked, waiting-on-parts, and waiting-on-customer states.
- Wireframe parts use/request and photo/file capture using existing capabilities.
- Wireframe completion/submission review with missing-information feedback.
- Keep current job and time state visible without overwhelming the capture task.
- Show save progress, failure, retry, duplicate submission, permission-limited, and high-content states.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-005/work-capture/` plus action and validation notes.

## Acceptance criteria
- Technicians can record work, evidence, blockers, and parts without manager-oriented navigation.
- Completion review makes missing requirements and submission consequences clear.
- Failure states never imply data was recorded when it was not.
- Existing workflow, status, parts, file, and permission rules remain unchanged.

## Guardrail
Do not add offline synchronization, push notifications, GPS, new completion rules, or production behavior in this child.
