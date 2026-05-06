# Local Demo Runbook

This runbook prepares a local UX preview and operator walkthrough for the current scaffold/stabilization baseline. It does not introduce seed data, new workflows, or deferred business domains.

## Audience and scope

Use this when a reviewer needs to confirm that the API, database dependency, and built frontend can run together on a workstation before a guided product walkthrough.

In scope:

- Validate required tools.
- Start the local SQL Server dependency.
- Restore, build, and test the backend.
- Build and preview the frontend.
- Smoke-check public readiness endpoints and route boundaries.

Out of scope:

- Production deployment.
- Cloud file storage.
- Purchase/vendor cost tracking, advanced inventory, compatibility recommendation logic, or AI/scoring recommendations.
- Creating representative production seed data.

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

### 3. Start the backend API

```bash
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=JobTicketSystem;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True" \
  dotnet run --project backend/src/Api/Api.csproj --urls http://localhost:5000
```

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
