# Phase 4A Pilot Readiness

Date: 2026-05-06

Phase 4A prepares the current scaffold/stabilization baseline for a bounded local pilot walkthrough. It adds opt-in demo data, a repeatable local runbook, and automated end-to-end workflow validation without adding deferred production domains.

## Scope

In scope:

- Local-only demo seed data for representative users, master data, job tickets, approved labor, approved parts, and invoice-ready reporting.
- A startup-hosted seed path controlled by configuration.
- A local pilot runbook that explains startup, credentials, smoke checks, route checks, and data reset expectations.
- Automated validation covering employee job visibility, clock in/out, work notes, part usage, manager approvals, and reporting visibility.

Out of scope:

- Production data seeding.
- Purchasing, inventory intelligence, compatibility recommendations, invoice creation/payment, cloud file storage, or external integrations.
- Public seed endpoints or unauthenticated mutation routes.

## Configuration contract

The pilot seed is disabled by default and must be explicitly enabled for a local/demo run:

```json
"PilotDemoSeed": {
  "Enabled": false,
  "MigrateDatabase": true
}
```

- `PilotDemoSeed:Enabled=true` runs the local seed hosted service on API startup.
- `PilotDemoSeed:MigrateDatabase=true` applies EF Core migrations before seeding. Keep this enabled for fresh local SQL Server volumes unless the database has already been migrated another way.
- The seed is idempotent. It uses customer account number `PILOT-4A` as the dataset marker and returns without duplicating records when the marker already exists.

## Demo credentials

These credentials are for local pilot data only. Do not use them in shared, staging, or production databases.

| Role | Username | Password | Purpose |
| --- | --- | --- | --- |
| Admin | `pilot.admin` | `PilotDemo123!` | Admin-only route and user-management checks. |
| Manager | `pilot.manager` | `PilotDemo123!` | Manager console, approvals, master-data, and reporting checks. |
| Employee | `pilot.tech` | `PilotDemo123!` | Employee mobile workflow checks. |

## Seeded pilot records

The seed creates:

- Two customers: the requesting account (`Phase 4A Demo Customer`) and billing office (`Phase 4A Billing Office`).
- One service location: `Demo Plant North`.
- One equipment record: `North Compressor Skid`.
- One vendor, one part category, and two pilot parts.
- Three job tickets:
  - `PILOT-READY-001`: completed, approved labor and approved part, invoice summary marked `Ready` for reports walkthroughs.
  - `PILOT-ACTIVE-002`: assigned to the employee for clock-in, work-note, part-used, and file/photo walkthroughs.
  - `PILOT-PARTS-003`: waiting on parts with a pending part line for manager review.

## Automated validation coverage

`PilotDemoSeedTests` validates that the seed is idempotent and that seeded data supports a representative end-to-end path:

1. Employee sees an assigned pilot ticket.
2. Employee clocks in and clocks out with GPS/device metadata.
3. Employee adds a work entry.
4. Employee adds a job part.
5. Manager approves the time entry.
6. Manager approves the job part.
7. Reports surface the seeded invoice-ready job and employee labor rollup.

Run backend validation with:

```bash
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln --no-build
```

## Operational guardrails

- Keep `PilotDemoSeed:Enabled=false` in committed default settings.
- Prefer environment variables for local seed activation.
- Use a disposable local SQL Server database or Docker volume for walkthroughs.
- Remove/reset the local volume after demos that should start from a clean seed state.
- Do not extend Phase 4A seed data into deferred purchasing, inventory intelligence, or recommendation workflows.
