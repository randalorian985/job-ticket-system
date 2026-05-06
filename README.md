# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

This repository is in a **foundation/stabilization phase** with core backend, employee workflow, and Manager/Admin phases 1-3C represented in the current local snapshot. A fresh 2026-05-06 pickup audit found Phase 3C implemented and frontend-validated locally, but backend validation, latest remote provenance, and the validated `scripts/setup-codex.sh` rerun remain blocked in this workspace.

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

## Validation Quick Run
From repository root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

- Phase 3B update: Manager/Admin master-data workflows now support create/edit/archive flows for customers, service locations, equipment, vendors, part categories, and parts in the UI and API.

- Phase 3C update: Manager/Admin reports workflow now includes expanded shared filters (billing party, service location, invoice status, offset/limit), clearer labor snapshot/fallback labeling, export-friendly numeric table formatting, and CSV export from loaded report datasets. Frontend install/build/tests passed in the fresh pickup audit; backend validation is still pending because this container does not have the .NET SDK.

- Foundation update: a public `GET /api/system/info` metadata endpoint now exposes service name, base API path, health endpoint path, environment name, and assembly version for deployment checks and frontend diagnostics.
