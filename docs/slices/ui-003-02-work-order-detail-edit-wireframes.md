# UI-003-02: Work Order Detail and Edit Wireframes

## Status
Planning child of UI-003.

## Goal
Design a work-order workspace that makes summary, status, ownership, blockers, history, and editing boundaries understandable.

## Dependencies
Requires UI-003-01 and approved UI-002 page anatomy.

## Scope
- Wireframe desktop work-order detail and explicit edit states.
- Place summary, customer/location, equipment, contacts, assignment, labor, parts, notes, files, activity, and invoice-readiness context.
- Define primary, secondary, destructive, and status-transition actions.
- Distinguish viewing, editing, historical/read-only, and permission-limited states.
- Define section navigation or progressive disclosure for long records without hiding critical status.
- Show save, cancel, conflict, stale-data, and unsaved-change behavior.

## Required artifacts
Static HTML under `docs/layout/wireframes/ui-003/detail-edit/` plus action hierarchy and interaction notes.

## Acceptance criteria
- Customer, location, equipment, contacts, status, assignment, blockers, and next action are understandable without scanning the whole record.
- Editing is visibly different from viewing.
- Long records remain navigable and critical context remains visible.
- Restricted and historical states preserve clarity without exposing unauthorized actions.

## Guardrail
Do not implement production UI or change workflow, status, permission, or data rules.
