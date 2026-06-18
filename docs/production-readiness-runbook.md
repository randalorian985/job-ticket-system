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

Create an online SQL Server backup before risky deploys and at the chosen recurring backup interval:

```bash
cd /opt/job-ticket-system
set -a
. ./.env.production
set +a

stamp="$(date +%Y%m%d%H%M%S)"
backup_dir="/opt/job-ticket-system/backups/$stamp"
mkdir -p "$backup_dir"

docker exec job-ticket-sqlserver mkdir -p /var/opt/mssql/backups
docker exec job-ticket-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "BACKUP DATABASE [JobTicketDb] TO DISK = N'/var/opt/mssql/backups/job-ticket-$stamp.bak' WITH INIT, COPY_ONLY"

docker cp "job-ticket-sqlserver:/var/opt/mssql/backups/job-ticket-$stamp.bak" "$backup_dir/job-ticket-$stamp.bak"
ls -lh "$backup_dir"
```

Back up uploaded files/photos by archiving the `api_files` volume:

```bash
stamp="$(date +%Y%m%d%H%M%S)"
backup_dir="/opt/job-ticket-system/backups/$stamp"
mkdir -p "$backup_dir"

docker run --rm \
  -v job-ticket-system_api_files:/source:ro \
  -v "$backup_dir:/backup" \
  alpine tar -czf "/backup/api-files-$stamp.tgz" -C /source .
```

## Backup Verification

Minimum backup verification:

```bash
cd /opt/job-ticket-system
set -a
. ./.env.production
set +a

docker cp "$backup_dir/job-ticket-$stamp.bak" job-ticket-sqlserver:/var/opt/mssql/backups/verify.bak
docker exec job-ticket-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "RESTORE VERIFYONLY FROM DISK = N'/var/opt/mssql/backups/verify.bak'"
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

The app can be treated as deployment-ready for controlled pilot/staging use only after validation passes, VPS health is green, and backups are verified.

Do not call it full client production-ready until:

- a recurring backup job and retention policy are active;
- at least one restore drill has been completed;
- uptime/log alerts are configured;
- client UAT is signed off;
- production seed/bootstrap flags are confirmed disabled after deploy.
