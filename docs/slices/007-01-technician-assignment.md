# Slice 007-01: Technician Assignment

## Status
Aligned with Kevin; child slice of Slice 007.

## Goal
Assign one or more eligible technician People to a backlog work order without scheduling a time block yet.

## Dependencies
Requires Slice 006-04 and completed applicable Slice 005 child slices.

## Scope
- Audit existing assignment entities, APIs, screens, visibility rules, and activity history.
- Select only active, eligible technician People from the centralized Person/workforce model.
- Support one or more technicians per work order.
- Support a lead technician when the current architecture and business rules allow it.
- Add and remove assignments with audit/activity history.
- Preserve technician assigned-ticket visibility restrictions.
- Prevent duplicate assignments and cross-tenant selection.
- Preserve historical assignments when technician eligibility later changes.

## Acceptance criteria
- Authorized managers or dispatchers can assign and remove eligible technicians.
- Multiple technicians and a lead technician work correctly where supported.
- Ineligible or inactive technicians cannot receive new assignments.
- Assigned technicians see only the work allowed by current permissions.
- Existing assignments remain intact.
- Tests and wiki documentation are updated.

## Guardrail
Do not add scheduled dates/times, dispatch-board behavior, labor entry, or a separate Employee/Technician identity model in this slice.