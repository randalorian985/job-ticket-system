# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets.

This repository is in a **Phase 4A pilot-readiness phase** with core backend, employee workflow, and Manager/Admin phases 1-3D validated on the current post-merge baseline. Phase 4A adds opt-in local pilot seed data, a local pilot runbook, and automated end-to-end workflow validation while keeping deferred production domains out of scope.

## Project Navigation
- **Project control center / roadmap:** [docs/build-roadmap.md](docs/build-roadmap.md)
- **Post-merge roadmap reset:** [docs/post-merge-roadmap-reset.md](docs/post-merge-roadmap-reset.md)
- **Reviewed current state baseline:** [docs/current-state-code-review.md](docs/current-state-code-review.md)
- **Scope contract:** [docs/project-scope.md](docs/project-scope.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Database design:** [docs/database-design.md](docs/database-design.md)
- **Development setup and validation commands:** [docs/development-setup.md](docs/development-setup.md)
- **Local demo runbook and UX preview readiness:** [docs/local-demo-runbook.md](docs/local-demo-runbook.md)
- **Phase 4A pilot readiness:** [docs/phase-4a-pilot-readiness.md](docs/phase-4a-pilot-readiness.md)

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


## Parts Usage History Visibility
Manager/Admin users can open `/manage/parts-usage-history` to review read-only historical part usage. The view uses cautious evidence labels such as “previously used on this equipment,” “commonly used with this model,” “technician-confirmed,” “possible match based on similar jobs,” and “needs verification.” It intentionally does not provide guaranteed compatibility claims, automatic recommendations, AI/scoring logic, confidence scores, purchasing workflows, vendor cost tracking, or advanced inventory.

## Public Platform Endpoints
- `GET /health`
- `GET /api/system/info`

## Stabilization Contract Notes
- Assigned-employee job-part API responses omit cost/sale snapshot fields; Manager/Admin responses retain those values for approval and reporting workflows.
- Work-note submissions use backend `WorkEntryType` numeric values (`1=Note`) and invalid enum values are rejected before persistence.
- File DTO responses expose safe metadata only and do not include storage provider keys or local file paths; uploads continue to return deterministic `201 Created` responses with API-relative `Location` headers.

## Web Codex Setup Validation
From repository root, run the setup validation script after making it executable:

```bash
chmod +x scripts/setup-codex.sh
./scripts/setup-codex.sh
```

The script installs or validates required Linux tools, .NET 8 SDK, GitHub CLI (`gh`), Docker client, and Docker Compose where the environment permits package installation. It confirms Node.js/npm availability, verifies the repository root structure, repairs the `origin` remote, attempts non-gating `origin` fetch / `origin/main` checks, restores the backend solution, installs frontend dependencies, and repeats the origin check at the end. If `GITHUB_TOKEN` or `GH_TOKEN` is present, the script attempts `gh auth login --with-token` without printing token values; unauthenticated `gh` remains a warning, not a setup failure.

Docker client and Compose checks do not prove that Docker Engine/container runtime privileges are available. The script runs `docker info` separately and warns when nested or restricted Codex containers can install Docker clients but cannot reach a daemon. The Docker-backed Phase 4A SQL Server walkthrough requires `docker info` to succeed and containers to run; use Docker Desktop, a workstation Docker Engine, or a CI/self-hosted runner with full Docker privileges for that walkthrough.

Remote Git operations are optional in web Codex and are not setup gates. The setup validation script repairs `origin` and attempts fetch checks, but it must continue when `git fetch`, `git pull`, `git push`, `gh auth login`, or `gh auth setup-git` cannot complete in a restricted environment.

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

- Phase 3B update: Manager/Admin master-data workflows now support list/detail DTO contracts plus create/edit/archive/unarchive flows for customers, service locations, equipment, vendors, part categories, and parts in the UI and API, including archived-record visibility for unarchive actions.

- Phase 3C update: Manager/Admin reports workflow now provides a reports hub for invoice-ready summary, job cost summary, jobs ready to invoice, labor by job/employee, parts by job, customer service history, and equipment service history. The UI uses existing reporting endpoints, supported shared filters, export-friendly tables, concise labor snapshot/fallback labeling, Manager/Admin route protection, and client-side CSV export from loaded report data.

- Phase 3D update: Admin user management now has a safer list/create/edit/deactivate/reset-password workflow with loading, empty, success, error, validation, and confirmation states. Manager/Admin route boundaries remain unchanged, with `/manage/users` Admin-only and employee workflow routing preserved.

- Post-merge roadmap reset: [docs/post-merge-roadmap-reset.md](docs/post-merge-roadmap-reset.md) records the 2026-05-06 post-merge validation reset. Backend/frontend validation passed on local `HEAD` `adfcf80084d7865bf67922c008ea20ab223f7086`, GitHub REST confirmed remote `main` at the same SHA, and direct `git fetch origin` remains a non-blocking HTTP 403 environment warning.

- Scope review update: [docs/scope-code-review.md](docs/scope-code-review.md) records the 2026-05-06 stabilization audit. Local validation passed, two small regressions were fixed, no migrations were added, and no deferred domains were implemented.

- Foundation update: a public `GET /api/system/info` metadata endpoint now exposes service name, base API path, health endpoint path, environment name, and assembly version for deployment checks and frontend diagnostics.

- UX preview readiness update: [docs/local-demo-runbook.md](docs/local-demo-runbook.md) now documents local demo startup/shutdown, health checks, Vite build preview, and the public `/preview` frontend readiness screen.

- Phase 4A update: Local pilot readiness now includes opt-in demo seed data, deterministic local credentials, a guided runbook, and automated end-to-end validation for employee clock-in/out, work notes, part usage, manager approvals, and reports visibility.
