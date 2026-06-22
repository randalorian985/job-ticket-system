# Production Readiness Runbook

This runbook covers the current single-VPS Docker deployment for the Job Ticket Management System.

It does not approve new business domains. Inventory expansion, receiving expansion, vendor invoice expansion, landed cost, client portals, payments, recommendations, AI/scoring, automatic compatibility, and automatic approval remain deferred.

## Runtime Shape

- App host: VPS running Docker Compose.
- Public app: host reverse proxy forwards public traffic to the frontend container on `127.0.0.1:8080`.
- Frontend container: serves the built React app and proxies `/api/*` plus `/health` to the API container.
- API container: ASP.NET Core app on port `80`.
- Database: SQL Server 2022 container with the `sqlserver_data` Docker volume.
- Uploaded files/photos: API local storage mounted in the `api_files` Docker volume.

## Required Secret File

Production uses `.env.production`, which must stay uncommitted.

Required keys:

```bash
SA_PASSWORD=replace-with-strong-sql-password
JWT_ISSUER=JobTicketSystem
JWT_AUDIENCE=JobTicketSystem.Api
JWT_SIGNING_KEY=replace-with-at-least-32-bytes-of-random-secret
```

Optional `APP_ADMIN_*` keys may exist for one-time bootstrap operations, but `TestBootstrap__Enabled` must remain `false` in normal production Compose configuration.

## Startup Guardrails

The production Compose file keeps these startup behaviors explicit:

- `DatabaseMigrations__ApplyOnStartup=true`: apply pending EF Core migrations at startup for this single-instance VPS deployment.
- `TestBootstrap__Enabled=false`: do not create or re-seed bootstrap admin accounts during normal production restarts.
- `PilotDemoSeed__Enabled=false`: do not create or re-seed pilot/demo records during normal production restarts.

If a new environment needs an initial admin account, perform that as a deliberate one-time operational step, then rotate the password and return bootstrap flags to disabled.

## Pre-Deploy Validation

Run from repository root before merging:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend
npm install
npm run build
npm test
```

## Deploy

Run on the VPS:

```bash
cd /opt/job-ticket-system
git switch main
git pull --ff-only origin main
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Then verify:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS https://dev.mudbugdigital.com/health
docker logs --tail 100 job-ticket-api
docker logs --tail 100 job-ticket-frontend
```

Expected:

- API, frontend, and SQL Server containers are `healthy`.
- `/health` returns JSON with `status: Healthy`.
- API logs show migrations are up to date.
- API logs do not show `Test environment bootstrap` or `Phase 4A local pilot seed data` running during normal production restart.

## Backup

Create and verify an online SQL Server backup plus uploaded-files archive before risky deploys and at the chosen recurring backup interval:

```bash
cd /opt/job-ticket-system
PROJECT_DIR=/opt/job-ticket-system RETENTION_DAYS=14 bash scripts/production-backup.sh
```

The script writes to `/opt/job-ticket-system/backups/<UTC stamp>/`, runs SQL Server `RESTORE VERIFYONLY`, archives the `api_files` volume, and removes backup directories older than `RETENTION_DAYS`.

To install a recurring daily backup on the current Ubuntu/systemd VPS as root:

```bash
cd /opt/job-ticket-system
install -m 750 scripts/production-backup.sh /usr/local/sbin/job-ticket-production-backup
install -m 644 deploy/systemd/job-ticket-production-backup.service /etc/systemd/system/job-ticket-production-backup.service
install -m 644 deploy/systemd/job-ticket-production-backup.timer /etc/systemd/system/job-ticket-production-backup.timer
systemctl daemon-reload
systemctl enable --now job-ticket-production-backup.timer
systemctl list-timers job-ticket-production-backup.timer
```

If a future host uses cron instead of systemd timers, use this fallback after confirming the cron service is installed and active:

```bash
cd /opt/job-ticket-system
install -m 750 scripts/production-backup.sh /usr/local/sbin/job-ticket-production-backup
cat >/etc/cron.d/job-ticket-production-backup <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 2 * * * root PROJECT_DIR=/opt/job-ticket-system RETENTION_DAYS=14 /usr/local/sbin/job-ticket-production-backup >> /var/log/job-ticket-production-backup.log 2>&1
CRON
```

## Backup Verification

Minimum backup verification is built into `scripts/production-backup.sh`. If a backup is being checked manually, use:

```bash
cd /opt/job-ticket-system
set -a
. ./.env.production
set +a

stamp="<backup stamp>"
backup_dir="/opt/job-ticket-system/backups/$stamp"
docker cp "$backup_dir/job-ticket-$stamp.bak" job-ticket-sqlserver:/var/opt/mssql/backups/manual-verify.bak
docker exec job-ticket-sqlserver chown mssql:mssql /var/opt/mssql/backups/manual-verify.bak
docker exec job-ticket-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C -b \
  -Q "RESTORE VERIFYONLY FROM DISK = N'/var/opt/mssql/backups/manual-verify.bak'"
```

A full restore drill should restore into a temporary database, confirm key tables are readable, then drop the temporary database. Run that drill before declaring client production go-live readiness.

## Rollback

For a code rollback:

```bash
cd /opt/job-ticket-system
git fetch origin
git checkout <known-good-merge-sha>
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
curl -fsS https://dev.mudbugdigital.com/health
```

After the incident is resolved, return to `main` deliberately:

```bash
git switch main
git pull --ff-only origin main
```

Database rollback should not be attempted automatically. Restore from a verified backup only when the data loss/consistency tradeoff is approved.

## Monitoring Checks

At minimum, check:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker logs --tail 200 job-ticket-api
docker logs --tail 100 job-ticket-frontend
df -h /
docker system df
curl -fsS https://dev.mudbugdigital.com/health
```

Production go-live should add automated uptime monitoring, log retention, backup retention, and alert routing.

## Client UAT Gate

Before declaring full client production readiness, complete and record human UAT for:

- login and role boundaries;
- dispatch board scheduling, assignment, day-of movement, ticket review, and ready-for-billing handoff;
- ticket creation, focused ticket editing, status change, labor, note, photo/file, parts, and archive-review flows;
- reports generation, CSV export, and browser print/save-PDF behavior;
- purchasing-support baseline actions;
- master-data create/edit/archive/unarchive;
- wiki access and workflow documentation accuracy;
- mobile Employee ticket workflow;
- mobile Manager/Admin dispatch and ticket workflow.

## Current Readiness Classification

The app can be treated as deployment-ready for a controlled production demo or pilot/staging use only after validation passes, VPS health is green, and backups are verified. The June 22 production-demo checklist is tracked in [Production Demo Readiness - 2026-06-22](./production-demo-readiness-2026-06-22.md).

Do not call it full client production-ready until:

- the recurring backup job and retention policy are active on the VPS;
- at least one restore drill has been completed;
- uptime/log alerts are configured;
- client UAT is signed off;
- production seed/bootstrap flags are confirmed disabled after deploy.
