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
- Record audit logs for create, update, status changes, archive, assignment changes, and work entry additions.

## Core Account and Location Definitions
- **Customer / Requesting Account**: The account that requests a job ticket to be created. This account is not always the same as the billing party.
- **Service Location**: The physical work site where service occurs. A service location stores company and site naming, on-site contact details, address fields, access instructions, safety requirements, and additional site notes.
- **Billing Party**: The customer/account that is financially responsible for invoice payment for a specific job ticket. Billing party can differ from the requesting account.
- **Equipment Owner**: The customer/account that owns a piece of equipment. Equipment ownership can differ from the billing party.
- **Equipment Responsible Billing Party**: The customer/account responsible for billing tied to equipment-level service responsibility. This party can differ from the equipment owner.
