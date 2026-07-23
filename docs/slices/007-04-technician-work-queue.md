# Slice 007-04: Technician Work Queue

## Status
Aligned child of Slice 007.

## Goal
Give technicians a focused, permission-safe queue of assigned and scheduled work.

## Dependencies
Requires Slices 007-01 through 007-03.

## Scope
- Audit the current technician dashboard, assigned-ticket list, schedule view, route protection, and mobile behavior.
- Show assigned work and today's scheduled work in a useful order.
- Display ticket status, scheduled time, customer, Service Location, equipment summary, service contact, and waiting-on-parts indicator where available.
- Open the existing technician-safe work-order workspace.
- Preserve assigned-ticket-only visibility and current permission checks.
- Support desktop and mobile widths without implementing the full technician execution workflow.

## Acceptance criteria
- Technicians see only authorized assigned work.
- Assigned and scheduled work is accurate and ordered usefully.
- Required location, equipment, contact, status, and schedule context is visible.
- Manager-only billing and administrative data is not exposed.
- Existing ticket access and mobile workflows do not regress.
- Focused tests, wiki, and screenshots are complete.

## Guardrail
Do not implement clock-in/out, labor, parts entry, photo capture, completion, offline synchronization, or broad technician-mobile redesign in this child.
