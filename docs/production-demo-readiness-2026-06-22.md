# Production Demo Readiness - 2026-06-22

This note records the controlled production-demo baseline for the single-VPS Job Ticket Management System deployment.

## Demo-Ready Baseline

- `/health` remains the public health gate for API and frontend proxy checks.
- Production Compose keeps `DatabaseMigrations__ApplyOnStartup=true` for the current single-instance VPS and keeps `TestBootstrap` plus `PilotDemoSeed` disabled for normal production restarts.
- The Manager/Admin job-ticket detail page is split into page orchestration, reusable workbench shell components, and pure display helpers so the demo-critical workflow is easier to maintain.
- A source-controlled production backup script is available at `scripts/production-backup.sh` for SQL Server backup, backup verification, uploaded-file archive, and retention cleanup.
- The service-ticket workflow audit now reflects that GitHub and VPS updates are available instead of the older workstation-blocked state.

## Operator Checklist

Run these before a client-facing demo:

```bash
dotnet test backend/JobTicketSystem.sln
cd frontend && npm run build
cd frontend && npm test
curl -fsS http://127.0.0.1:8080/health
curl -fsS https://dev.mudbugdigital.com/health
```

On the VPS, create and verify a fresh backup before risky changes:

```bash
PROJECT_DIR=/opt/job-ticket-system RETENTION_DAYS=14 ./scripts/production-backup.sh
```

For a recurring daily backup, install the script and cron entry as root:

```bash
install -m 750 scripts/production-backup.sh /usr/local/sbin/job-ticket-production-backup
cat >/etc/cron.d/job-ticket-production-backup <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 2 * * * root PROJECT_DIR=/opt/job-ticket-system RETENTION_DAYS=14 /usr/local/sbin/job-ticket-production-backup >> /var/log/job-ticket-production-backup.log 2>&1
CRON
```

## Remaining Go-Live Gates

This is a controlled production-demo baseline, not a full client production go-live declaration. Before full production go-live, complete and record:

- a full temporary-database restore drill;
- off-host backup copy or storage;
- uptime, container-health, disk, log-error, and backup-failure alerting;
- client UAT signoff;
- credential rotation for any pilot/bootstrap credentials that were ever enabled on the VPS.
