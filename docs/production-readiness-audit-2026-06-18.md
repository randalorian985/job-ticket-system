# Production Readiness Audit - June 18, 2026

## Scope

This audit reviewed the current `main` branch and the VPS deployment posture for production-readiness risks.

Reviewed areas:

- source-controlled Docker and nginx deployment configuration;
- API startup configuration and health checks;
- JWT, bootstrap, pilot seed, and upload guardrails;
- file/photo storage boundaries;
- validation/test commands;
- VPS container health, disk headroom, runtime logs, and public health route;
- backup, restore, rollback, and client UAT documentation.

No purchasing expansion, receiving, vendor invoice tracking expansion, landed-cost expansion, warehouse/truck inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, auth weakening, enum renumbering, hard-delete, or historical migration edit was introduced.

## Summary

The app is suitable for controlled pilot/staging deployment after validation and VPS health checks pass. It should not be described as fully client production-ready until recurring backups, restore drills, monitoring/alerts, and client UAT are completed and recorded.

## Findings And Fixes

| Finding | Risk | Implemented fix |
| --- | --- | --- |
| Production Compose and nginx configuration existed on the VPS but not in source control | Deploy behavior could drift or be lost | Added `docker-compose.prod.yml`, `deploy/nginx.prod.conf`, and `deploy/env.production.example` |
| VPS production Compose enabled `TestBootstrap__Enabled` and `PilotDemoSeed__Enabled` | Demo/bootstrap records could be re-seeded on restarts and confuse production data posture | Source-controlled production Compose disables test bootstrap and pilot seed startup |
| Database migration execution was coupled to test/demo bootstrap hosted services | Disabling seed services would also remove the only automatic migration path | Added an explicit `DatabaseMigrations__ApplyOnStartup` hosted service for single-instance VPS deployment |
| File upload max size existed at the HTTP controller only | Service-level callers could bypass the intended 50 MB limit | Added shared service/controller max-size constant and service validation with regression coverage |
| Public health was not documented as part of production reverse-proxy behavior | Operators could check the wrong port or miss proxy issues | Added production nginx `/health` proxy to source control and documented health verification |
| No production backup/restore/rollback runbook existed | Operator response depended on memory instead of repeatable steps | Added `docs/production-readiness-runbook.md` |
| VPS had no source-controlled backup directory or runbook-backed backup verification record | Data recovery readiness was not provable | Runbook now defines SQL and file backup commands plus backup verification expectations |

## VPS Snapshot

VPS status observed during this audit:

- deployed repo SHA before this pass: `0a4d111`;
- branch: `main`;
- containers: API, frontend, and SQL Server running and healthy;
- disk headroom: about 75 GB free on the root volume;
- public `https://dev.mudbugdigital.com/health` returned healthy JSON;
- API container `/health` returned healthy JSON;
- Docker build cache was high relative to active image/container size and should be pruned during maintenance windows.

## Validation Requirements

Required validation for this pass:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

## Backup And Restore Status

Backup verification performed during this pass:

- SQL Server backup created at `/opt/job-ticket-system/backups/20260618205238/job-ticket-20260618205238.bak`;
- SQL Server `RESTORE VERIFYONLY` reported `The backup set on file 1 is valid.`;
- uploaded-files volume archive created at `/opt/job-ticket-system/backups/20260618205238/api-files-20260618205238.tgz`.

Full client production readiness still requires:

- recurring automated backups;
- retention policy and off-host storage;
- a full temporary-database restore drill;
- alerting if a backup or health check fails.

Full client production readiness remains blocked until the recurring backup job and restore drill are completed and documented.

## Database Impacts

No schema migration was added and no historical migration was edited.

The new startup service only applies pending EF Core migrations when `DatabaseMigrations__ApplyOnStartup=true`. The default appsettings keep it disabled. Production Compose enables it for the current single-instance VPS deployment.

## API Impacts

No API route, DTO shape, enum value, auth policy, or controller contract changed.

Job-ticket file/photo uploads now enforce the existing 50 MB request-size boundary inside the application service as well as at the HTTP controller.

## Documentation Updates

Updated or added:

- `docs/production-readiness-runbook.md`;
- this production readiness audit;
- README project navigation;
- API contract file/photo upload notes;
- client wiki upload guidance;
- roadmap and scope notes for the production-readiness hardening pass.

## Remaining Recommendations

- Add automated daily SQL and uploaded-file backups with retention.
- Complete a full restore into a temporary database and record the result.
- Configure uptime, container-health, disk, and log-error alerts.
- Rotate any pilot/bootstrap credentials that were ever enabled on the VPS.
- Prune Docker build cache during a maintenance window after confirming rollback images are not needed.
- Complete client UAT before full production go-live.
