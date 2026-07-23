# UI-005: Technician Mobile Workflow

## Status
Planning parent scope only. Requires UI-001 and UI-002 and coordinates with UI-003.

## Goal
Design technician queue/context, active work/time, work capture/completion, and error/accessibility states as separate planning children.

## Required child sequence
1. [UI-005-01 Queue and Pre-Work Context](ui-005-01-queue-prework-context.md)
2. [UI-005-02 Active Work and Time Capture](ui-005-02-active-work-time-capture.md)
3. [UI-005-03 Work Capture, Blockers, and Completion](ui-005-03-work-capture-completion.md)
4. [UI-005-04 Error, Session, and Accessibility States](ui-005-04-error-session-accessibility.md)

## Shared decisions
- Mobile design is task-first and intentionally different from manager desktop workflows.
- Critical customer, location, equipment, contact, schedule, and safety context is visible before work begins.
- Current time state and the next primary action remain clear.
- Designs preserve existing permissions and business rules and do not promise unsupported offline editing.
- Touch, keyboard, focus, safe-area, and common mobile viewport constraints are explicit.

## Parent acceptance criteria
- All four children form one coherent field workflow.
- Technicians can find, understand, start, update, block, and submit work without manager-oriented navigation.
- Failure states never imply data was saved when it was not.
- Production implementation can be divided by queue, active-work, capture, and resilience boundaries.

## Guardrail
Do not send this parent to Codex and do not add GPS, push notifications, offline synchronization, or production behavior during UI-005 planning.
