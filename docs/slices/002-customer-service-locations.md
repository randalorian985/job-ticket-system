# Slice 002: Customer Service Locations

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Provide reusable customer service locations and one reusable minimal creation capability.

## Dependencies
Requires Slice 001-01.

## Required child sequence
1. [002-01 Service Location Core](002-01-service-location-core.md)
2. [002-02 Service Location Quick-Create](002-02-service-location-quick-create.md)

## Shared decisions
- Each Service Location belongs to one customer Organization in the MVP.
- Historical tickets and equipment retain inactive location references.
- People and location-specific contact roles remain in later People and work-order slices.
- Quick-create reuses the canonical location model and validation.

## Parent acceptance criteria
- Both children are complete.
- Customers can manage several distinguishable service locations.
- Existing ticket and equipment relationships remain valid.
- Later equipment and work-order slices can depend on one location model and quick-create contract.

## Guardrail
Do not send this parent to Codex. Do not include equipment, work-order intake, or contact-role implementation beyond compatibility required by the target child.
