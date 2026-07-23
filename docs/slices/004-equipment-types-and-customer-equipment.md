# Slice 004: Equipment Types and Customer Equipment

## Status
Aligned with Kevin at a high level. Parent steering scope only.

## Goal
Provide reusable equipment classifications, physical customer-equipment records, and one reusable customer-equipment creation capability.

## Dependencies
Requires Slices 001-01 and 002-01.

## Required child sequence
1. [004-01 Equipment Types](004-01-equipment-types.md)
2. [004-02 Customer Equipment](004-02-customer-equipment.md)
3. [004-03 Customer Equipment Quick-Create](004-03-customer-equipment-quick-create.md)

## Shared decisions
- Equipment Type describes a reusable classification or model context.
- Customer Equipment represents one physical unit at one customer Service Location in the MVP.
- Manufacturer references use Organizations with the applicable role.
- Existing ticket-equipment relationships and historical inactive equipment references must remain valid.
- Quick-create reuses the canonical physical-equipment capability.

## Parent acceptance criteria
- All three children are complete.
- Reusable types and distinct physical units remain separate concepts.
- Existing equipment and ticket links remain usable.
- Work-order slices can depend on one Customer Equipment model and one quick-create contract.

## Guardrail
Do not send this parent to Codex. Do not implement work-order equipment assignment or scheduling in Slice 004.
