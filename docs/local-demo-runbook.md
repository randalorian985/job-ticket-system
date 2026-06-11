# Local Demo Runbook

This runbook prepares a local UX preview and pilot walkthrough for the current job-ticket baseline. It includes opt-in local demo seed data, but does not introduce production seed data, new deferred workflows, or deferred business domains.

## Audience and scope

Use this when a reviewer needs to confirm that the API, database dependency, and built frontend can run together on a workstation before a guided product walkthrough.

In scope:
- Validate required tools.
- Choose and verify a SQL Server dependency.
- Restore, build, and test the backend.
- Build and preview the frontend.
- Smoke-check public readiness endpoints, seeded pilot credentials, route boundaries, employee ticket workflow, in-ticket parts add/request flow, Manager/Admin parts request review, and existing purchasing-support/inventory-foundation baseline visibility.

Out of scope:
- Production deployment.
- Cloud file storage.
- New purchasing expansion beyond the implemented baseline, receiving expansion, vendor invoice expansion, landed-cost expansion, warehouse/truck inventory, replenishment, compatibility recommendation logic, or AI/scoring recommendations.
- Creating representative production seed data. Pilot seed data is local/demo-only and must remain disabled by default.

## Ports and URLs

| Surface | Default URL | Purpose |
| --- | --- | --- |
| SQL Server | `localhost:1433` for Docker, or your configured SQL Server | Local database dependency. |
| Backend API | `http://localhost:5000` or the URL emitted by `dotnet run` | ASP.NET Core API host. |
| Health check | `http://localhost:5000/health` | Public backend liveness/readiness smoke check. |
| System info | `http://localhost:5000/api/system/info` | Public API metadata smoke check. |
| Frontend dev | `http://localhost:5173` | Vite dev server for iterative UI work. |
| Frontend preview | `http://localhost:4173` | Vite preview server for the production build output. |
| UX readiness page | `http://localhost:4173/preview` | Public static frontend readiness screen for demo operators. |

If `dotnet run` chooses a different backend URL, use that emitted URL consistently. Because Vite embeds `VITE_API_BASE_URL` during `npm run build`, set the value before building the frontend, then restart preview from that freshly built bundle.

## One-time workstation preparation

1. Install the required tools from the development setup guide:
   - .NET SDK 8.x.
   - Node.js 20.19.0+.
   - npm.
   - SQL Server access through Docker, a local SQL Server install, a named instance, or another development SQL Server.
   - Docker Desktop or Docker Engine with Compose only when using the Docker-backed SQL Server path.
2. From the repository root, confirm the core toolchain:

   ```bash
   dotnet --info
   node --version
   npm --version
   ```

3. If using Docker SQL Server, also confirm Docker daemon access:

   ```bash
   docker --version
   docker compose version
   docker info
   ```

   `docker info` must succeed before the Docker-backed SQL Server walkthrough.

## Demo startup sequence

Run these commands from the repository root unless a step says otherwise.

### 1. Choose the SQL Server connection

The API reads `ConnectionStrings:DefaultConnection`; in shell commands, set `ConnectionStrings__DefaultConnection`.

Docker SQL Server example:

```bash
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=JobTicketSystem;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True"
```

Windows integrated-security example:

```powershell
$env:ConnectionStrings__DefaultConnection="Server=YOUR-SQL-SERVER;Database=JobTicketSystem;Integrated Security=True;TrustServerCertificate=True"
```

### 2. Start SQL Server if using Docker

```bash
docker compose up -d
```

Wait until the `job-ticket-sqlserver` health check is healthy before relying on database-backed API routes.

### 3. Restore and validate the backend

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln --no-restore
dotnet test backend/JobTicketSystem.sln --no-build
```

### 4. Start the backend API with local pilot seed data

The pilot seed is disabled by default in committed settings. Enable it with environment variables only for local/demo databases.

Bash with Docker SQL authentication:

```bash
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=JobTicketSystem;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True" \
PilotDemoSeed__Enabled=true \
PilotDemoSeed__MigrateDatabase=true \
  dotnet run --project backend/src/Api/Api.csproj --urls http://localhost:5000
```

PowerShell with integrated security:

```powershell
$env:ConnectionStrings__DefaultConnection="Server=YOUR-SQL-SERVER;Database=JobTicketSystem;Integrated Security=True;TrustServerCertificate=True"
$env:PilotDemoSeed__Enabled="true"
$env:PilotDemoSeed__MigrateDatabase="true"
dotnet run --project backend/src/Api/Api.csproj --urls http://localhost:5000
```

Expected backend log behavior:
- On a fresh local database, the API applies EF Core migrations, creates the pilot seed dataset, and logs the demo user/job-ticket counts.
- On a previously seeded local database, startup reports the seed is already present and does not duplicate records.
- In non-demo environments, omit `PilotDemoSeed__Enabled=true` so the seed hosted service does nothing.

Keep this process running for the rest of the demo.

### 5. Smoke-check public backend endpoints

In a second terminal from the repository root:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/system/info
```

Expected result:
- `/health` returns JSON with an overall status.
- `/api/system/info` returns service metadata that includes the API base path and health endpoint path.

### 6. Build and preview the frontend

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:5000 npm run build
npm run preview -- --host 0.0.0.0
```

Keep the preview process running.

## Pilot credentials

Use these credentials only against local seeded pilot databases:

| Role | Username | Password | Walkthrough use |
| --- | --- | --- | --- |
| Admin | `pilot.admin` | `PilotDemo123!` | Admin-only route and user-management checks. |
| Manager | `pilot.manager` | `PilotDemo123!` | Manager console, approvals, master-data, reports, and parts request queue checks. |
| Employee | `pilot.tech` | `PilotDemo123!` | Employee ticket, time, file, and in-ticket parts checks. |

Seeded tickets to reference during a walkthrough:
- `PILOT-READY-001`: completed ticket with approved labor/part lines, invoice-ready reporting data, and an approved Needs ordered catalog-matched parts request example.
- `PILOT-ACTIVE-002`: employee-assigned ticket for clock-in/out, work-note, file/photo, and existing-part selection without Needs ordered.
- `PILOT-PARTS-003`: waiting-on-parts ticket with pending existing-part Needs ordered, pending unlisted Needs ordered, and rejected unlisted Needs ordered examples for Manager/Admin review.

Seeded safe lookup catalog examples:
- `PILOT-FILTER-001` Compressor intake filter.
- `PILOT-BELT-002` Drive belt kit.
- `PILOT-HOSE-003` Hydraulic return hose.
- `PILOT-SEAL-004` Cylinder seal kit.

## Guided route walkthrough

Use these checks after the backend and frontend preview are both running.

1. Visit `/preview` and confirm the readiness cards render.
2. Visit `/login` and confirm the employee login screen renders.
3. Visit `/manage` while signed out and confirm protected routing sends the user to login.
4. Sign in with prepared local demo credentials.
5. Confirm role-specific navigation:
   - Employee users land on `/jobs`.
   - Manager and Admin users land on `/manage`.
   - Admin-only user management remains isolated to `/manage/users`.

## End-to-end workflow walkthrough

Use this path after backend, frontend preview, and seed data are running:

1. Sign in as `pilot.tech` and confirm the employee lands on `/jobs`.
2. Open ticket `PILOT-ACTIVE-002`.
3. Clock in with browser location permissions enabled, or provide allowed local location values if the browser prompts.
4. Add a work note describing the inspection.
5. In `Add / Request Part`, search for `PILOT-HOSE-003` or `hose`, select `Hydraulic return hose`, clear `Needs ordered`, and submit it as a ticket part.
6. In `Add / Request Part`, type a new/unlisted part such as `Unlisted crane pendant cable`, leave `Needs ordered` checked, add notes, and submit it to the parts request queue.
7. Clock out with a short work summary.
8. Sign out, then sign in as `pilot.manager`.
9. Open the Manager/Admin console at `/manage` and then the parts request queue.
10. Search/filter the queue and confirm Needs ordered requests from `PILOT-PARTS-003` plus the newly submitted unlisted request appear.
11. Select a request, match it to a catalog part if appropriate, update status/internal notes/cost/billable price/billable state, and save.
12. Open Purchasing and Inventory from the Manager/Admin navigation and confirm the existing baseline pages render; do not use this walkthrough to validate new purchasing expansion, receiving expansion, vendor invoice expansion, landed-cost expansion, warehouse/truck inventory, replenishment, recommendations, or AI/scoring.
13. Open reports and confirm `PILOT-READY-001` appears in invoice-ready or cost summary reporting.
14. Optional Admin check: sign in as `pilot.admin` and confirm `/manage/users` is available.

Automated backend validation for the representative seed path is covered by `PilotDemoSeedTests`:

```bash
dotnet test backend/JobTicketSystem.sln --no-build --filter PilotDemoSeedTests
```

## Shutdown

Stop frontend and backend processes with `Ctrl+C`.

If you used Docker SQL Server, stop the database dependency:

```bash
docker compose down
```

To remove local Docker SQL Server data as well:

```bash
docker compose down -v
```

For non-Docker SQL Server, reset or drop the demo database with your normal SQL Server tooling when the seeded walkthrough data is no longer needed.

## Troubleshooting

### Docker CLI exists but containers cannot start

The Docker seeded walkthrough requires a working Docker daemon that can pull images, create container layers, and start containers with the published SQL Server port. The `docker --version` and `docker compose version` checks confirm the client tools, but they are not enough by themselves; run `docker info` before `docker compose up -d`. If `docker info` or `docker compose up -d` fails with daemon, mount, layer extraction, or permission errors, use a non-Docker SQL Server connection string or rerun the Docker-backed walkthrough on Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with full Docker Engine privileges.

### SQL Server login or connection fails

Confirm the backend was started with the intended `ConnectionStrings__DefaultConnection` value. For integrated security, confirm the Windows account running the API has SQL Server login and database permissions.

### Frontend cannot reach the backend

Confirm the frontend was built with the same backend base URL emitted by the API process. Rebuild before restarting preview because Vite environment variables are baked into the production bundle:

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:5000 npm run build
npm run preview -- --host 0.0.0.0
```

### Health endpoint fails

Confirm the backend process is still running and the API URL is correct:

```bash
curl http://localhost:5000/health
```

If database-backed endpoints fail but `/health` succeeds, confirm SQL Server is available.

### Pilot seed data does not appear

Confirm the API was started with seed activation enabled and against the intended local database:

```bash
PilotDemoSeed__Enabled=true
PilotDemoSeed__MigrateDatabase=true
```

Then restart the API and watch for the seed log line. If the database was already seeded, records are not duplicated. To force a clean local Docker seed, stop the API and reset the Docker volume:

```bash
docker compose down -v
docker compose up -d
```

For non-Docker SQL Server, reset the target database with your normal SQL Server tooling, then restart the API with the same seed settings.
