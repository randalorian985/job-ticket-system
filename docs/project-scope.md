# Project Scope

## Goal
Build a Job Ticket Management System that allows teams to submit, assign, track, and resolve job tickets.

## In Scope (Initial Direction)
- Ticket creation and lifecycle states
- Assignment workflow
- Basic prioritization and categorization
- Status tracking and audit timestamps
- API-first backend with React frontend

## Out of Scope (for this scaffold)
- Advanced analytics and forecasting reports
- Notifications integrations
- SSO/enterprise identity setup
- Complex SLA engine

## Current Phase
Foundation/stabilization. Core workflows are implemented for backend APIs, employee mobile operations, and Manager/Admin UI Phase 1 read-first operational screens.

## Frontend Workflow Status
- React Employee Mobile Workflow is implemented with login, auth state, assigned-job list/detail, clock in/out with GPS, work-note submission, part-used submission, and file/photo upload screens.

## Current Job Ticket Workflow (API-First Foundation)
- Create job tickets with required requesting account (`CustomerId`), service location (`ServiceLocationId`), and billing party (`BillingPartyCustomerId`).
- Optional equipment linkage with validation to ensure equipment belongs to the selected service location.
- Update core job metadata (title/description, priority, status, requested/scheduled/due/completed dates, billing contact, notes, manager, PO number).
- Change status independently through a dedicated status endpoint with completed-date conventions.
- Archive tickets using soft-delete semantics with a required archive reason.
- Assign and unassign employees with duplicate-assignment prevention.
- Add and list non-time-tracking work notes (work entries).
- Track parts used on job tickets with immutable pricing snapshots and optional inventory decrement/restore behavior.
- Approve, reject (with reason), update, and archive job part usage entries through dedicated workflow endpoints.
- Upload and manage job ticket files/photos with soft-archive behavior and optional linkage to equipment/work entries.
- Persist file metadata in SQL while storing file content through a pluggable storage provider abstraction (local provider in this phase).
- Record audit logs for create, update, status changes, archive, assignment changes, and work entry additions.
  - Includes job part add/update/archive/approve/reject and job file upload/update/archive actions.

## Core Account and Location Definitions
- **Customer / Requesting Account**: The account that requests a job ticket to be created. This account is not always the same as the billing party.
- **Service Location**: The physical work site where service occurs. A service location stores company and site naming, on-site contact details, address fields, access instructions, safety requirements, and additional site notes.
- **Billing Party**: The customer/account that is financially responsible for invoice payment for a specific job ticket. Billing party can differ from the requesting account.
- **Equipment Owner**: The customer/account that owns a piece of equipment. Equipment ownership can differ from the billing party.
- **Equipment Responsible Billing Party**: The customer/account responsible for billing tied to equipment-level service responsibility. This party can differ from the equipment owner.


## Time Tracking Workflow (Current API Foundation)
- Employees clock in/out against job tickets with required GPS coordinates and optional location accuracy metadata.
- Clock-in validation requires active employee records, active job tickets, and active assignment to the ticket.
- Employees are prevented from having multiple open time entries and cannot close entries belonging to other employees.
- Clock-out calculates tracked duration (`TotalMinutes`, `LaborHours`, `BillableHours`) and records work summary notes through job work entries.
- Clock-in now captures immutable labor-rate snapshots (`CostRateSnapshot`, `BillRateSnapshot`) used by reporting to keep historical totals stable; legacy rows without snapshots fall back to current employee rates.
- Managers can approve, reject (with required reason), and adjust time entries through dedicated workflow endpoints.
- Adjustments preserve original values and new values in `TimeEntryAdjustment` records for auditability.
- Audit logs capture clock-in, clock-out, approval, rejection, and adjustment actions.
- Authentication and role-based authorization are active using JWT bearer tokens.
- Employee access is assignment-scoped for job-specific workflows.
- Manager/Admin approval and archive workflows are policy-protected for time and part approvals.

## Future Parts Compatibility Engine Data Capture
- This phase adds **structured compatibility data capture only** for equipment and job-ticket-part history.
- Equipment records now support manufacturer, model number, serial number, equipment type, unit number, and year attributes.
- Job ticket part records can optionally capture component category, failure/repair details, technician notes, installation/removal timestamps, success outcome, and compatibility notes.
- Job ticket parts can optionally link to a specific equipment record and to another job ticket part record that replaced it.
- This phase **does not** implement compatibility recommendations, AI/ML behavior, or automated part suggestions.


## Reporting Foundation (Current API Foundation)
- Added read-only reporting endpoints for invoice-ready summaries, job cost summaries, jobs ready to invoice, labor rollups, parts rollups, and customer/equipment service history.
- Reporting calculations are constrained to approved labor and approved job parts by default.
- Labor totals support separate employee cost and bill rates when present.
- Parts totals use immutable job-part snapshot pricing to preserve financial history.
- This phase does not create invoices, process payments, or add authentication/UI flows.
- File/photo upload currently supports local development storage and intentionally defers cloud storage providers (Azure Blob Storage/S3) to a later phase.


## Authentication & Role Enforcement Phase

This phase adds foundational security controls without replacing existing workflows:

- JWT bearer token validation now re-checks the token subject against active employee status to block archived/inactive accounts immediately on protected requests.
- Local username/email + password auth with hashed passwords.
- JWT bearer token issuance for API clients.
- Role enforcement for `Admin`, `Manager`, `Employee`.
- Assignment-aware authorization for employee access to job-specific actions (jobs, time tracking, files, and parts workflows).
- Admin user management endpoints for CRUD/archive/reset-password.
- No external SSO/OAuth, password reset workflow, or email verification in this phase.


## Manager/Admin UI Phase 1 (Implemented)
- Protected manager/admin shell route (`/manage`) with dashboard navigation for operational sections.
- Read-first list/detail visibility for job tickets, including assignments, work entries, time entries, parts, and file/photo metadata.
- Read-first operational lists for customers, service locations, equipment, parts, vendors, and part categories.
- Manager/admin approval screens for time entries and job parts using existing approval endpoints.
- Manager/admin reports index view with direct access to existing reporting endpoints and snapshot-first labor reporting note.
- Admin-only user list route (`/manage/users`) isolated from manager users.
- Employee mobile workflow routes remain active (`/login`, `/jobs`, `/jobs/:jobTicketId`).
- Deferred domains remain unchanged: parts purchase/vendor cost tracking, advanced inventory, and parts compatibility recommendation engine are not implemented in this phase.


## Manager/Admin UI Phase 2 (Implemented)
- Job ticket detail now supports manager/admin assignment management (assign/unassign with duplicate prevention UX and refresh after mutation).
- Manager/admin job ticket create route is available at `/manage/job-tickets/new` and edit workflows are available from the ticket detail screen.
- Job ticket status/archive flows include explicit enum-value labels, confirmation prompts, and error/success messaging.
- Reports view now supports query filters (date range, customer, employee, status), export-friendly table rendering, and client-side CSV export from loaded data.
- Manager/admin master-data pages now include targeted create/edit/archive forms for customers, service locations, and parts.
- Admin-only users page now includes targeted create/edit/archive/reset-password operations via existing `/api/users` endpoints.
- Employee route tree (`/jobs`, `/jobs/:jobTicketId`) remains unchanged.
- Deferred domains remain unchanged and unimplemented: parts purchase/vendor cost tracking, advanced inventory, compatibility recommendation engine.
