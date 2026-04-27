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
- Advanced reporting
- Notifications integrations
- SSO/enterprise identity setup
- Complex SLA engine

## Current Phase
Foundation/scaffolding only. No full domain workflows are implemented yet.

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
- Record audit logs for create, update, status changes, archive, assignment changes, and work entry additions.
  - Includes job part add/update/archive/approve/reject actions.

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
- Managers can approve, reject (with required reason), and adjust time entries through dedicated workflow endpoints.
- Adjustments preserve original values and new values in `TimeEntryAdjustment` records for auditability.
- Audit logs capture clock-in, clock-out, approval, rejection, and adjustment actions.
- Authentication is intentionally deferred; temporary manager/employee identifiers are accepted through DTOs in this phase.
- Job part workflow follows the same authentication deferment with temporary actor/employee identifiers in DTOs.

## Future Parts Compatibility Engine Data Capture
- This phase adds **structured compatibility data capture only** for equipment and job-ticket-part history.
- Equipment records now support manufacturer, model number, serial number, equipment type, unit number, and year attributes.
- Job ticket part records can optionally capture component category, failure/repair details, technician notes, installation/removal timestamps, success outcome, and compatibility notes.
- Job ticket parts can optionally link to a specific equipment record and to another job ticket part record that replaced it.
- This phase **does not** implement compatibility recommendations, AI/ML behavior, or automated part suggestions.
