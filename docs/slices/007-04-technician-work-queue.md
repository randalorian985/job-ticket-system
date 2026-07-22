# Slice 007-04: Technician Work Queue

## Status
Aligned with Kevin; child slice of Slice 007.

## Goal
Give technicians a focused list of assigned and scheduled work without exposing manager-only or billing information.

## Dependencies
Requires Slices 007-01 through 007-03.

## Scope
- Audit the current technician dashboard, assigned-ticket list, schedule view, route protections, and mobile behavior.
- Show assigned work and today's scheduled work in a clear technician queue.
- Display ticket status, scheduled time, customer/service location, equipment summary, service contact, and waiting-on-parts indicator where available.
- Open the existing technician-safe work-order workspace.
- Preserve assigned-ticket-only visibility and current role/permission checks.
- Support desktop and mobile widths without redesigning the full technician execution workspace.

## Acceptance criteria
- Technicians see only work they are authorized to see.
- Assigned and scheduled work appears accurately and in a useful order.
- Required location, equipment, contact, status, and schedule context is available.
- Manager-only billing and administrative data is not exposed.
- Existing ticket access and mobile workflows do not regress.
- Tests, wiki, and screenshots are updated.

## Guardrail
Do not implement clock-in/out, labor, parts entry, photo capture, completion, offline synchronization, or the broad application-shell redesign in this slice.