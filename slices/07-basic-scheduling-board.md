# Slice 07: Basic Scheduling Board

## Goal
Turn a backlog work order into a technician assignment with a date/time schedule block that is visible and manageable from a basic scheduling board.

## Dependencies
Requires Slice 05 Employees and Slice 06 Work Order Intake.

## Existing-system rule
Audit current assignments, calendar integrations, dispatch views, technician visibility, and scheduling UI. Reuse current ticket assignment architecture and avoid building a second scheduling system.

## Scope
- Backlog queue of unscheduled work orders.
- Technician and time assignment.
- Start and end date/time or duration according to existing scheduling conventions.
- Basic day/week scheduling board.
- Move or edit an existing schedule block.
- Remove scheduling while keeping the work order in backlog.
- Support multiple assigned technicians if the current approved ticket model permits it, with one lead technician where already established.
- Ensure technicians see only work orders they are authorized and assigned to see.
- Preserve calendar synchronization behavior already implemented; do not broaden external-calendar scope unless required to keep existing behavior working.

## Business rules
- Scheduling does not close or complete the work order.
- Only active, assignable employees may receive new schedule blocks.
- Conflicts should be visible; hard conflict blocking is not required unless already part of the system.
- Unscheduling returns the work order to an unscheduled backlog state without deleting it.
- Historical assignments remain auditable.

## Acceptance criteria
- A backlog work order can be assigned to a technician and time.
- The assignment appears as a schedule block.
- Editing the block updates the work order assignment.
- Removing the block returns it to backlog.
- The technician can access the assigned ticket through the employee workflow.
- Existing assignment and calendar behavior does not regress.

## Tests
- Backlog-to-schedule tracer bullet.
- Active technician filtering.
- Create, move, edit, and remove schedule blocks.
- Technician visibility and authorization.
- Multiple-tech behavior where currently supported.
- Tenant isolation and existing calendar regression coverage.

## Definition of done
The scheduling board completes Backlog Work Order -> Technician and Time Assignment -> Schedule Block, with tests and updated wiki/screenshots.