# Slice 003-01: Person Core

## Status
Aligned child of Slice 003.

## Goal
Create or repair the canonical Person identity and direct management workflow.

## Dependencies
Requires Slice 001-01.

## Scope
- Audit current contact, person, employee-linked, technician-linked, and user-linked identity records without migrating workforce behavior in this child.
- Provide Person list, create, view, edit, activate, and deactivate behavior.
- Support identifying and contact fields already required by current workflows.
- Allow zero or one primary Organization in the MVP.
- Search by name, organization, email, phone, and existing person/contact number where supported.
- Detect likely duplicate People using verified identifying information.
- Preserve historical references and tenant isolation.

## Acceptance criteria
- Canonical Person records can be managed without creating duplicate identity systems.
- Existing contact records are preserved or safely mapped to Person.
- Inactive People remain historically readable.
- Search, validation, permissions, tenant boundaries, tests, migration handling, and wiki documentation are complete.

## Guardrail
Do not implement saved roles, reusable quick-create, workforce profiles, login linkage, authorization, ticket contact assignment, or scheduling in this child.
