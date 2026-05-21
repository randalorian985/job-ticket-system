# Development Setup

This guide explains how to prepare a local development environment for the live Job Ticket Management System platform. The repository is no longer scaffold-only: the validated baseline now includes the core backend/API, employee mobile workflow, Manager/Admin phases 1 through 3D, Phase 4A local pilot readiness, Phase 4B workflow polish, and Parts Purchase / Vendor Cost Tracking Phase 2.

## Required tools

- **.NET SDK 8.x** (repository pins SDK via `backend/global.json`)
- **Node.js 20.0.0+ LTS**
- **npm** (bundled with Node.js)
- **Docker Desktop** or **Docker Engine + Compose plugin** for the local SQL Server walkthrough
- Optional but recommended:
  - GitHub CLI (`gh`) for authenticated remote workflows
  - VS Code or Visual Studio
  - SQL Server Management Studio or Azure Data Studio

## Platform guardrails

- Keep backend architecture layers separated (`Domain`, `Application`, `Infrastructure`, `Api`).
- Keep controllers thin and move business rules into application services.
- Use DTO request/response contracts; do not expose EF entities directly.
- Preserve soft-delete/archive behavior rather than hard-delete flows.
- Keep employee routes, Manager/Admin routes, and role boundaries working while making changes.
- Use `docs/build-roadmap.md`, `docs/project-scope.md`, `README.md`, and `docs/api-contract.md` as the scope contract before starting new work.

## Web Codex setup validation

From repository root:

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

For web Codex and similarly restricted environments, remote Git operations are optional and non-gating. The setup script intentionally keeps validation moving even when `git fetch`, `git pull`, `git push`, `gh auth login`, or `gh auth setup-git` cannot complete from the current container.

The script installs or validates required Linux tools, .NET 8 SDK, GitHub CLI (`gh`), Docker client, and Docker Compose where package installation is available. It confirms Node.js/npm availability, verifies the repository root structure, repairs the `origin` remote, attempts non-gating `origin` fetch and `origin/main` checks, restores the backend solution, installs frontend dependencies, and repeats the origin check at the end. When `GITHUB_TOKEN` or `GH_TOKEN` is present, it attempts GitHub CLI authentication without printing token values; unauthenticated `gh` remains a warning, not a setup failure.

Docker client installation is separate from Docker Engine daemon availability. The setup script runs `docker --version`, `docker compose version`, and `docker info`; failure of `docker info` in a nested or restricted container means the client tools may be installed while container runtime privileges are unavailable. That is an environment limitation, not a product validation failure. The Docker-backed SQL Server walkthrough and Phase 4A demo flow must be run where `docker info` succeeds and containers can start.

## Local demo and UX preview

For a guided local walkthrough, use [Local Demo Runbook](./local-demo-runbook.md). It covers SQL Server startup, backend validation, public `/health` and `/api/system/info` checks, Vite production-build preview, and the public frontend `/preview` readiness route.

## Local setup steps

1. Clone the repository.
2. Copy `.env.example` to `.env` and adjust values only if your local environment requires it.
3. Start SQL Server using the Docker walkthrough below.
4. Restore, build, and test the backend.
5. Install, build, and test the frontend.
6. Run database migrations if your database is not already up to date.
7. Start the API and frontend for manual verification.

## SQL Server Docker setup

From the repository root, first confirm daemon access and then start SQL Server:

```bash
docker --version
docker compose version
docker info
docker compose up -d
```

`docker info` must succeed before relying on the Docker-backed SQL Server walkthrough. If it fails in a restricted container, rerun this portion on Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with full Docker privileges.

Connection details for local development:

- Host: `localhost`
- Port: `1433`
- Username: `sa`
- Password: `DevPassword123!`
- Default connection string key: `ConnectionStrings__DefaultConnection`

Stop the container:

```bash
docker compose down
```

To also remove persisted SQL data:

```bash
docker compose down -v
```

## Database migrations

From repository root, apply the current schema to your local database:

```bash
dotnet ef database update --project backend/src/Infrastructure/Infrastructure.csproj --startup-project backend/src/Api/Api.csproj
```

If `dotnet ef` is not installed locally yet:

```bash
dotnet tool install --global dotnet-ef
```

Only add a new migration when a scoped schema or index change is part of the approved work.

## Backend validation commands

From repository root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
```

Health and compatibility endpoints should remain available at:

- `GET /health`
- `GET /api/system/info`

## Frontend validation commands

Node.js requirement for frontend install, build, and test: **20.0.0+**.

From repository root:

```bash
cd frontend
npm install
npm run build
npm test
```

## Manual app startup

Run the backend API from repository root:

```bash
dotnet run --project backend/src/Api/Api.csproj
```

In a separate terminal, run the frontend:

```bash
cd frontend
npm run dev
```

## Troubleshooting

### Missing .NET SDK

Symptom:

- `A compatible .NET SDK was not found` or a similar error.

Fix:

1. Install .NET 8 SDK.
2. Verify the install:

   ```bash
   dotnet --list-sdks
   ```

3. Ensure the installed version satisfies `backend/global.json` (`8.0.100` with `rollForward: latestFeature`).

### npm registry or network failures

Symptoms:

- `npm ERR! code ENOTFOUND`
- `npm ERR! network`
- TLS or certificate issues

Fixes:

1. Verify the registry:

   ```bash
   npm config get registry
   ```

2. Use the default public registry if it is misconfigured:

   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

3. Retry a clean install:

   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

4. If you are behind a corporate proxy, configure npm proxy and CA settings according to your organization policy.

### Docker client works but Docker engine is unavailable

Symptoms:

- `docker --version` succeeds but `docker info` fails
- `docker compose up -d` cannot start SQL Server

Fixes:

1. Confirm you are running where Docker daemon access is allowed.
2. Move the Docker-backed steps to Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with container privileges.
3. Continue non-Docker validation where possible if the environment restriction only affects local database startup.
