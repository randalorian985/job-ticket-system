# Build Roadmap (Project Control Center)

## Purpose
This document is the execution control center for the Crane / Job Ticket System build sequence. It distinguishes what is already complete, what should be stabilized now, what bounded phase comes next, and what remains intentionally deferred.

## Architecture and Stack Baseline (Current Contract)
The roadmap assumes and preserves the current architecture and scope contracts:
- Backend: .NET 8 / ASP.NET Core Web API
- Frontend: React + TypeScript + Vite
- Database: SQL Server
- Persistence: EF Core
- API style: DTO-based services and thin controllers
- Security: role-based authorization (`Admin`, `Manager`, `Employee`)
- Data lifecycle: soft-delete/archive behavior for supported entities

## Completed Scope (As of April 29, 2026)
### Platform/Foundation
- Clean architecture layering is established across `Domain`, `Application`, `Infrastructure`, and `Api`.
- Health endpoint is available at `GET /health`.
- Core documentation set is in place (`project-scope`, `api-contract`, `database-design`, `development-setup`).

### Backend/API Functional Foundation
- Authentication and role-based access control are implemented.
- Master data APIs are implemented (customers, service locations, equipment, vendors, part categories, parts).
- Job ticket lifecycle foundation is implemented (create/list/detail/update/status/archive).
- Job assignments, work entries, time tracking, job parts workflows, and job file workflows are implemented.
- Reporting foundation endpoints are implemented (invoice-ready, cost summaries, labor/parts rollups, service history).

### Frontend Foundation
- Employee workflow routes are implemented for login, assigned jobs, job details, time tracking, notes, parts-used entry, and uploads.
- Manager/Admin workflow phases 1-2 are implemented for operations, approvals, reporting visibility, and admin user management.
- Manager/Admin Phase 3A archive confirmation slice is implemented.

## Current Stabilization Priorities (Now)
Focus this cycle on hardening and alignment, not feature expansion:
1. Documentation consistency across roadmap, scope, and API contract.
2. Build reliability and repeatable validation (`restore`, `build`, `test`) for backend and frontend.
3. Contract integrity checks (no unplanned endpoint/authorization behavior drift).
4. UX/operational polish only where it does not alter scope or architecture contracts.

## Next Planned Bounded Phase (Recommended)
## Phase: Manager/Admin UI Phase 3B (Bounded)
Recommended narrow next phase is a documentation-backed UI consolidation slice limited to existing APIs:
- Improve manager/admin workflow coherence for existing pages and actions only.
- Tighten consistency of status, archive, and approval user feedback patterns.
- Keep all changes within existing endpoint and authorization contracts.
- No new domain workflows, no schema changes, and no expansion into deferred domains.

Exit criteria for 3B:
- No API contract changes required.
- No database migration required.
- Employee workflow remains stable.
- Backend and frontend standard validations pass.

## Deferred Phases / Domains (Explicitly Not In Scope)
The following remain deferred unless explicitly selected in a future approved scope decision:
- Parts purchase / vendor cost tracking
- Advanced inventory workflows
- Parts compatibility recommendation engine
- AI/scoring-based part recommendations

Roadmap rule: deferred domains must not be partially implemented "on the way" to other tasks.

## Merge and Validation Expectations
Before merge, run the standard validation commands from repository root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

If any command cannot be completed in the current environment, the PR must explicitly list which commands need to be re-run locally or in CI.

## Documentation Alignment Expectations
When roadmap scope changes, maintain alignment across:
- `README.md` (high-level orientation + links only)
- `docs/project-scope.md` (scope boundaries and phase statements)
- `docs/api-contract.md` (implemented/deferred API behavior)
- `docs/development-setup.md` (authoritative validation commands)

Documentation-first governance rules:
- Keep completed scope and deferred scope explicitly separated.
- Do not represent deferred domains as partially active.
- Keep roadmap detail in this file; avoid duplicating full roadmap narrative in `README.md`.
