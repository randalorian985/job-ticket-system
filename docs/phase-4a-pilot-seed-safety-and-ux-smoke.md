# Phase 4A Pilot Seed Safety and UX Smoke Review

Date: 2026-05-06

## Review scope

This review validates the Phase 4A pilot seed guardrails and performs a local UX smoke test against the current scaffold/stabilization baseline. It does not approve production seeding, broaden pilot scope, or add deferred workflows.

## Seed safety review

| Check | Result | Evidence |
| --- | --- | --- |
| Demo seed remains opt-in | Pass | Committed `appsettings.json` and `appsettings.Example.json` keep `PilotDemoSeed:Enabled=false`. |
| Startup seed is gated by configuration | Pass | `PilotDemoSeedHostedService` returns immediately unless `PilotDemoSeed:Enabled` is true. |
| Database migration is explicit local/demo behavior | Pass | The hosted service only runs EF Core migrations when `PilotDemoSeed:MigrateDatabase` is true and the provider is relational. |
| Seed data is idempotent | Pass | `PilotDemoSeedService` checks the `PILOT-4A` customer account-number marker before creating the dataset. |
| No public seed mutation route found | Pass | Repository search found the seed path registered as a hosted service, not exposed through an API controller endpoint. |
| Pilot credentials are documented as local-only | Pass | Phase 4A docs identify the pilot credentials as local/demo-only and warn against shared, staging, or production databases. |

## Local validation commands

The following commands were run from the repository root unless otherwise noted:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln --no-restore
dotnet test backend/JobTicketSystem.sln --no-build
dotnet test backend/JobTicketSystem.sln --no-build --filter PilotDemoSeedTests
cd frontend && npm install && npm run build && npm test
cd frontend && VITE_API_BASE_URL=http://localhost:5000 npm run build
ASPNETCORE_ENVIRONMENT=Development PilotDemoSeed__Enabled=false dotnet run --project backend/src/Api/Api.csproj --no-build --urls http://localhost:5000
curl -fsS http://localhost:5000/health
curl -fsS http://localhost:5000/api/system/info
cd frontend && npm run preview -- --host 0.0.0.0
curl -fsS http://localhost:4173/preview
curl -fsS http://localhost:4173/login
curl -fsS http://localhost:4173/manage
```

## Local UX smoke result

| Surface | Result | Notes |
| --- | --- | --- |
| Backend build | Pass | Solution built with 0 warnings and 0 errors. |
| Backend tests | Pass | Full backend test suite passed: 92 tests. |
| Pilot seed tests | Pass | `PilotDemoSeedTests` passed: 2 tests covering idempotence and representative workflow support. |
| API health endpoint | Pass | `/health` returned `Healthy` while the API ran with the pilot seed disabled. |
| API system info endpoint | Pass | `/api/system/info` returned service metadata including `/api` and `/health`. |
| Frontend install/build/tests | Pass | Production build completed and Vitest passed: 42 tests across 9 files. |
| Frontend preview smoke | Pass | Vite preview served the production SPA shell for `/preview`, `/login`, and `/manage`. |
| Seeded SQL Server startup | Not run | Docker is not installed in this environment, so the local SQL Server dependency from `docker-compose.yml` could not be started for a seeded database walkthrough. |

## Findings

- No Phase 4A seed safety blocker was found in the committed defaults or hosted-service activation path.
- The local static UX smoke path is healthy for the built frontend bundle and protected route shell coverage remains backed by automated frontend tests.
- The only environment limitation is the missing Docker CLI, which prevented a full seeded SQL Server startup and browser walkthrough with `pilot.*` credentials in this container.

## Follow-up before a guided stakeholder walkthrough

1. Run the seeded database startup on a workstation with Docker available.
2. Sign in with `pilot.tech`, `pilot.manager`, and optionally `pilot.admin` against the seeded database.
3. Confirm the browser-rendered workflow for `PILOT-ACTIVE-002`, manager approvals, and `PILOT-READY-001` reporting visibility.
