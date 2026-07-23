# UI-005: Technician Mobile Workflow Wireframes

## Status
Planning. Requires UI-001 and UI-002. Coordinate with UI-003 work-order concepts.

## Goal
Design a mobile-first technician workflow that makes assigned work, job context, time capture, notes, parts, photos, blockers, and completion actions easy to understand in the field.

## Scope
- Wireframe assigned-work list and daily queue.
- Wireframe job summary with customer, location, equipment, contacts, schedule, and safety-critical information.
- Wireframe clock-in, pause, resume, and clock-out states according to existing business rules.
- Wireframe work notes, status updates, blockers, parts use/request, and photo/file capture.
- Define offline or network-error presentation without promising unsupported offline editing.
- Define large touch targets, keyboard behavior, safe areas, focus order, and minimal-scroll action placement.
- Define what technicians may view versus edit.

## Required wireframes
Create static HTML under `docs/layout/wireframes/ui-005/` for:
- Assigned-work list.
- Upcoming versus active work states.
- Job overview before starting.
- Active-job workspace.
- Time capture and correction feedback.
- Notes, parts, and photo flows.
- Blocked/waiting-on-parts state.
- Completion and submission review.
- Network failure and expired-session states.

## Acceptance criteria
- A technician can identify the next assigned job and its critical context quickly.
- The current time state and primary action are always clear.
- Work capture does not require navigating through manager-oriented screens.
- Important customer, equipment, schedule, and safety context is visible before work begins.
- Save, failure, and retry states do not imply data was recorded when it was not.
- Designs remain usable with one hand, an on-screen keyboard, and common mobile viewport constraints.

## Guardrail
Do not add offline synchronization, GPS tracking, push notifications, or other future capabilities merely because they appear useful in a mobile mockup.

## Definition of done
The technician mobile workflow is approved as a coherent end-to-end field experience and is ready to be split into production implementation slices.
