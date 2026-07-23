# UI-005-01: Queue and Pre-Work Context

## Status
Planning child of UI-005.

## Goal
Design how technicians find assigned work and understand critical job context before starting.

## Dependencies
Requires UI-002 and UI-001 technician findings.

## Scope
- Wireframe assigned-work list, today's work, upcoming work, and blocked/waiting states.
- Wireframe job overview before starting.
- Show status, schedule, customer, Service Location, equipment, contacts, scope, priority, safety-critical information, and waiting-on-parts context.
- Define ordering, grouping, search/filter needs, unread/changed indicators, and manager-only data exclusions.
- Show mobile loading, empty, error, expired-session, and restricted states only as they affect queue/pre-work entry.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-005/queue-prework/` plus information-priority notes.

## Acceptance criteria
- A technician can identify the next assigned job quickly.
- Critical context is visible before work begins.
- Upcoming, active, blocked, and completed/submitted states are distinguishable.
- Manager-only and billing data are not exposed.

## Guardrail
Do not design time capture, notes, parts, photos, or completion actions in this child.
