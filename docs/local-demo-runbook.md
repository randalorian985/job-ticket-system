# Local Demo Runbook

This runbook prepares a local UX preview and Phase 4A pilot walkthrough for the current scaffold/stabilization baseline. It includes opt-in local demo seed data, but does not introduce production seed data, new deferred workflows, or deferred business domains.

## Audience and scope

Use this when a reviewer needs to confirm that the API, database dependency, and built frontend can run together on a workstation before a guided product walkthrough.

In scope:

- Validate required tools.
- Start the local SQL Server dependency.
- Restore, build, and test the backend.
- Build and preview the frontend.
- Smoke-check public readiness endpoints, seeded pilot credentials, route boundaries, and the representative end-to-end workflow.

Out of scope:

- Production deployment.
- Cloud file storage.
- Purchase/vendor cost tracking, advanced inventory, compatibility recommendation logic, or AI/scoring recommendations.
- Creating representative production seed data. Phase 4A seed data is local/demo-only and must remain disabled by default.

## Ports and URLs

| Surface | Default URL | Purpose |
| --- | --- | --- |
| SQL Server | `localhost:1433` | Local database dependency from Docker Compose. |
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
   - Node.js 20.0.0+.
   - npm.
   - Docker Desktop or Docker Engine with Compose.
2. From the repository root, confirm the toolchain:

   ```bash
   dotnet --info
   node --version
   npm --version
   docker compose version
   ```

## Demo startup sequence

Run these commands from the repository root unless a step says otherwise.

### 1. Start SQL Server

```bash
docker compose up -d
```

Optional readiness check:

```bash
docker compose ps
```

Wait until the `job-ticket-sqlserver` health check is healthy before relying on database-backed API routes.

If the workstation does not have Docker available and the review is limited to the public UX preview smoke path, record that as an environment limitation and continue with backend validation, public `/health`, public `/api/system/info`, and the static `/preview` page. Do not exercise sign-in or database-backed walkthrough steps until SQL Server is available.

### 2. Restore and validate the backend

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln --no-restore
dotnet test backend/JobTicketSystem.sln --no-build
```

### 3. Start the backend API with Phase 4A local pilot seed data

The pilot seed is disabled by default in committed settings. Enable it with environment variables only for local/demo databases:

```bash
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=JobTicketSystem;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True" \
PilotDemoSeed__Enabled=true \
PilotDemoSeed__MigrateDatabase=true \
  dotnet run --project backend/src/Api/Api.csproj --urls http://localhost:5000
```

Expected backend log behavior:

- On a fresh local database, the API applies EF Core migrations, creates the Phase 4A seed dataset, and logs the demo user/job-ticket counts.
- On a previously seeded local database, startup reports the seed is already present and does not duplicate records.
- In non-demo environments, omit `PilotDemoSeed__Enabled=true` so the seed hosted service does nothing.

Keep this process running for the rest of the demo.

### 4. Smoke-check public backend endpoints

In a second terminal from the repository root:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/system/info
```

Expected result:

- `/health` returns JSON with an overall status.
- `/api/system/info` returns service metadata that includes the API base path and health endpoint path.

### 5. Build and preview the frontend

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:5000 npm run build
npm run preview -- --host 0.0.0.0
```

Keep the preview process running.

### 6. Open the UX readiness screen

Open:

```text
http://localhost:4173/preview
```

Confirm that the page renders the readiness summary and links to:

- Employee login (`/login`).
- Manager/Admin console (`/manage`).

The readiness page is static and public by design. It proves that the built frontend bundle can render before a reviewer signs in or connects prepared demo data.


## Phase 4A pilot credentials

Use these credentials only against local seeded pilot databases:

| Role | Username | Password | Walkthrough use |
| --- | --- | --- | --- |
| Admin | `pilot.admin` | `PilotDemo123!` | Admin-only route and user-management checks. |
| Manager | `pilot.manager` | `PilotDemo123!` | Manager console, approvals, master-data, and reporting checks. |
| Employee | `pilot.tech` | `PilotDemo123!` | Employee mobile workflow checks. |

Seeded tickets to reference during a walkthrough:

- `PILOT-READY-001`: completed ticket with approved labor/part lines and invoice-ready reporting data.
- `PILOT-ACTIVE-002`: employee-assigned ticket for clock-in/out, work-note, part-used, and file/photo walkthroughs.
- `PILOT-PARTS-003`: waiting-on-parts ticket with a pending part line for manager review.

## Guided route walkthrough

Use these checks after the backend and frontend preview are both running.

1. Visit `/preview` and confirm the readiness cards render.
2. Visit `/login` and confirm the employee login screen renders.
3. Visit `/manage` while signed out and confirm protected routing sends the user to login.
4. Sign in with prepared local demo credentials, if a demo database has already been created for the walkthrough.
5. Confirm role-specific navigation:
   - Employee users land on `/jobs`.
   - Manager and Admin users land on `/manage`.
   - Admin-only user management remains isolated to `/manage/users`.


## Phase 4A end-to-end workflow walkthrough

Use this path after backend, frontend preview, and seed data are running:

1. Sign in as `pilot.tech` and confirm the employee lands on `/jobs`.
2. Open ticket `PILOT-ACTIVE-002`.
3. Clock in with browser location permissions enabled, or provide allowed local location values if the browser prompts.
4. Add a work note describing the inspection.
5. Add a used part from the seeded catalog, such as `PILOT-FILTER-001`.
6. Clock out with a short work summary.
7. Sign out, then sign in as `pilot.manager`.
8. Open the Manager/Admin console at `/manage`.
9. Confirm manager access to job tickets, reports, and approval-focused screens.
10. Review the newly added time/part lines on `PILOT-ACTIVE-002` and approve them if exposed by the current UI path.
11. Open reports and confirm `PILOT-READY-001` appears in invoice-ready or cost summary reporting.
12. Optional Admin check: sign in as `pilot.admin` and confirm `/manage/users` is available.

Automated backend validation for this representative path is covered by `PilotDemoSeedTests`:

```bash
dotnet test backend/JobTicketSystem.sln --no-build --filter PilotDemoSeedTests
```

## Shutdown

Stop frontend and backend processes with `Ctrl+C`, then stop the database dependency:

```bash
docker compose down
```

To remove local SQL Server data as well:

```bash
docker compose down -v
```

## Troubleshooting

### Docker CLI exists but containers cannot start

The Phase 4A seeded walkthrough requires a working Docker daemon that can pull images, create container layers, and start containers with the published SQL Server port. The `docker --version` and `docker compose version` checks confirm the client tools, but they are not enough by themselves. If `docker compose up -d` fails with daemon, mount, layer extraction, or permission errors, record the environment limitation and rerun the seeded SQL Server walkthrough on a workstation or CI runner with full Docker Engine privileges. Do not substitute an in-memory database for the Docker-backed local pilot walkthrough.

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

If database-backed endpoints fail but `/health` succeeds, confirm SQL Server is healthy:

```bash
docker compose ps
```

### Frontend preview serves an old build

Rebuild before restarting preview:

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:5000 npm run build
npm run preview -- --host 0.0.0.0
```


### Pilot seed data does not appear

Confirm the API was started with seed activation enabled and against the intended local database:

```bash
PilotDemoSeed__Enabled=true
PilotDemoSeed__MigrateDatabase=true
```

Then restart the API and watch for the Phase 4A seed log line. If the database was already seeded, records are not duplicated. To force a clean local seed, stop the API and reset the Docker volume:

```bash
docker compose down -v
docker compose up -d
```
