# Development Setup

This guide explains how to prepare a local development environment for the Job Ticket Management System scaffold.

## Required tools

- **.NET SDK 8.x** (repository pins SDK via `backend/global.json`)
- **Node.js 20.0.0+ LTS** (or newer compatible LTS)
- **npm** (bundled with Node.js)
- **Docker Desktop** (or Docker Engine + Compose plugin)
- Optional but recommended:
  - VS Code or Visual Studio
  - SQL Server Management Studio / Azure Data Studio

## Codex environment notes

- This repository is currently scaffold-focused.
- Keep architecture layers separated (`Domain`, `Application`, `Infrastructure`, `Api`).
- Avoid implementing business entities/workflows until scope docs are approved.
- When using this guide in automated environments, run commands from the repository root unless otherwise noted.


## Web Codex setup validation

From repository root:

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

For web Codex, remote Git operations are optional and non-gating. The setup script intentionally skips required gates for `git fetch`, `git pull`, `git push`, `gh auth login`, and `gh auth setup-git`; validation must continue from the current workspace even when remote access is unavailable.

The script installs or validates required Linux tools, .NET 8 SDK, GitHub CLI (`gh`), Docker client, and Docker Compose where package installation is available. It confirms Node.js/npm availability, verifies the repository root structure, repairs the `origin` remote, attempts non-gating `origin` fetch / `origin/main` checks, restores the backend solution, installs frontend dependencies, and repeats the origin check at the end. When `GITHUB_TOKEN` or `GH_TOKEN` is present, it attempts GitHub CLI authentication without printing token values; unauthenticated `gh` remains a warning, not a setup failure.

Docker client installation is separate from Docker Engine daemon availability. The setup script runs `docker --version`, `docker compose version`, and `docker info`; failure of `docker info` in a nested/Codex container means the client tools may be installed but container runtime privileges are unavailable. This is an environment limitation, not a product validation failure. The Docker-backed Phase 4A SQL Server walkthrough must be run where `docker info` succeeds and containers can start, such as Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with full Docker privileges.

## Local demo and UX preview

For a guided local walkthrough, use the dedicated runbook: [Local Demo Runbook](./local-demo-runbook.md). It covers SQL Server startup, backend validation, public `/health` and `/api/system/info` checks, Vite production-build preview, and the public frontend `/preview` readiness route.

## Local setup steps

1. Clone the repository.
2. Create local environment variables:
   - Copy `.env.example` to `.env` and adjust only if needed.
3. Start SQL Server dependency (see Docker section below).
4. Restore and build backend.
5. Install and build frontend.

## SQL Server Docker setup

From the repository root, first confirm daemon access and then start SQL Server:

```bash
docker --version
docker compose version
docker info
docker compose up -d
```

`docker info` must succeed before relying on the Docker-backed SQL Server walkthrough. If it fails in a nested/Codex container, rerun this portion on Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with full Docker privileges.

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

## Backend commands (restore/build/test)

From repository root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
```

Health endpoint should remain available at:

- `GET /health`

## Frontend commands (install/build)

Node.js requirement for frontend install/build/test: **20.0.0+**.

From repository root:

```bash
cd frontend
npm install
npm run build
```

## Troubleshooting

### Missing .NET SDK

Symptom:

- `A compatible .NET SDK was not found` or similar error.

Fix:

1. Install .NET 8 SDK.
2. Verify install:

   ```bash
   dotnet --list-sdks
   ```

3. Ensure version supports repository pin in `backend/global.json` (`8.0.100` with `rollForward: latestFeature`).

### npm registry / network failures

Symptoms:

- `npm ERR! code ENOTFOUND`
- `npm ERR! network`
- TLS/certificate issues.

Fixes:

1. Verify registry:

   ```bash
   npm config get registry
   ```

2. Use default public registry if misconfigured:

   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

3. Retry clean install:

   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

4. If behind a corporate proxy, configure npm proxy/ca settings according to your organization policy.
