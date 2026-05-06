# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

This repository is in a **post-Phase 3C/3D stabilization phase** with core backend, employee workflow, and Manager/Admin phases 1-3D validated on the current post-merge baseline. Phase 3C/3D work is complete; the next work should stay focused on stabilization, observability, documentation hygiene, or explicitly approved new scope without entering deferred domains.

## Project Navigation
- **Project control center / roadmap:** [docs/build-roadmap.md](docs/build-roadmap.md)
- **Post-merge roadmap reset:** [docs/post-merge-roadmap-reset.md](docs/post-merge-roadmap-reset.md)
- **Reviewed current state baseline:** [docs/current-state-code-review.md](docs/current-state-code-review.md)
- **Scope contract:** [docs/project-scope.md](docs/project-scope.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Database design:** [docs/database-design.md](docs/database-design.md)
- **Development setup and validation commands:** [docs/development-setup.md](docs/development-setup.md)
- **Local demo runbook and UX preview readiness:** [docs/local-demo-runbook.md](docs/local-demo-runbook.md)

## Tech Stack
- **Backend:** .NET 8 ASP.NET Core Web API
- **Frontend:** React + TypeScript (Vite)
- **Database:** Microsoft SQL Server
- **ORM:** Entity Framework Core

## Repository Structure

```text
/backend
  /src
    /Api
    /Application
    /Domain
    /Infrastructure
  /tests

/frontend
  /src
    /api
    /components
    /pages
    /routes
    /features

/docs
```

## Public Platform Endpoints
- `GET /health`
- `GET /api/system/info`

## Web Codex Setup Validation
From repository root, run the setup validation script after making it executable:

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

The script installs or makes available the .NET 8 SDK before backend validation, exports `DOTNET_ROOT`, prepends `DOTNET_ROOT` and `DOTNET_ROOT/tools` to `PATH`, restores/builds the backend solution, runs backend tests only when test projects exist, installs frontend dependencies, and then runs frontend build/test through `package.json` scripts.

Remote Git operations are optional in web Codex and are not setup gates. The setup validation script does not require `git fetch`, `git pull`, `git push`, `gh auth login`, or `gh auth setup-git` to pass.

## Manual Validation Quick Run
From repository root after tools are available:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln --no-restore
dotnet test backend/JobTicketSystem.sln --no-build
cd frontend
npm install
npm run build
npm test
```

- Phase 3B update: Manager/Admin master-data workflows now support create/edit/archive flows for customers, service locations, equipment, vendors, part categories, and parts in the UI and API.

- Phase 3C update: Manager/Admin reports workflow now provides a reports hub for invoice-ready summary, job cost summary, jobs ready to invoice, labor by job/employee, parts by job, customer service history, and equipment service history. The UI uses existing reporting endpoints, supported shared filters, export-friendly tables, concise labor snapshot/fallback labeling, Manager/Admin route protection, and client-side CSV export from loaded report data.

- Phase 3D update: Admin user management now has a safer list/create/edit/deactivate/reset-password workflow with loading, empty, success, error, validation, and confirmation states. Manager/Admin route boundaries remain unchanged, with `/manage/users` Admin-only and employee workflow routing preserved.

- Post-merge roadmap reset: [docs/post-merge-roadmap-reset.md](docs/post-merge-roadmap-reset.md) records the 2026-05-06 post-merge validation reset. Backend/frontend validation passed on local `HEAD` `adfcf80084d7865bf67922c008ea20ab223f7086`, GitHub REST confirmed remote `main` at the same SHA, and direct `git fetch origin` remains a non-blocking HTTP 403 environment warning.

- Scope review update: [docs/scope-code-review.md](docs/scope-code-review.md) records the 2026-05-06 stabilization audit. Local validation passed, two small regressions were fixed, no migrations were added, and no deferred domains were implemented.

- Foundation update: a public `GET /api/system/info` metadata endpoint now exposes service name, base API path, health endpoint path, environment name, and assembly version for deployment checks and frontend diagnostics.

- UX preview readiness update: [docs/local-demo-runbook.md](docs/local-demo-runbook.md) now documents local demo startup/shutdown, health checks, Vite build preview, and the public `/preview` frontend readiness screen.
