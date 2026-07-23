# Slice 007-01: Technician Assignment

## Status
Aligned child of Slice 007.

## Goal
Assign one or more eligible technician People to a backlog work order without scheduling a time block.

## Dependencies
Requires Slices 006-07 and 005-04, plus applicable authorization children.

## Scope
- Audit existing assignment entities, APIs, screens, selectors, visibility rules, and activity history.
- Select only active, eligible technician People from the canonical workforce model.
- Support one or more technicians and a lead technician where current business rules allow it.
- Add and remove assignments with audit history.
- Prevent duplicate assignments and cross-tenant selection.
- Preserve assigned-ticket visibility restrictions and historical assignments when later eligibility changes.

## Acceptance criteria
- Authorized managers or dispatchers can assign and remove eligible technicians.
- Multiple-technician and lead behavior works where supported.
- Inactive or ineligible People cannot receive new assignments.
- Existing assignments remain intact and assigned users see only authorized work.
- Focused tests and wiki documentation are complete.

## Guardrail
Do not add schedule dates/times, dispatch-board behavior, labor entry, or another Employee/Technician identity model in this child.
