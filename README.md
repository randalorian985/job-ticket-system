# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

This repository is in a **foundation/stabilization phase** with core backend, employee workflow, and Manager/Admin phases 1-3D represented in the current local snapshot. Phase 3D adds Admin user-management polish, role-aware Manager/Admin UX hardening, and regression coverage without entering deferred domains.

## Project Navigation
- **Project control center / roadmap:** [docs/build-roadmap.md](docs/build-roadmap.md)
- **Reviewed current state baseline:** [docs/current-state-code-review.md](docs/current-state-code-review.md)
- **Scope contract:** [docs/project-scope.md](docs/project-scope.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Database design:** [docs/database-design.md](docs/database-design.md)
- **Development setup and validation commands:** [docs/development-setup.md](docs/development-setup.md)

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

- Foundation update: a public `GET /api/system/info` metadata endpoint now exposes service name, base API path, health endpoint path, environment name, and assembly version for deployment checks and frontend diagnostics.
