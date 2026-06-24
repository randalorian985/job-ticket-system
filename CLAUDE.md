# Claude Code Instructions

## Purpose
This repository is in scaffold phase. Keep changes focused, explicit, and easy to review.

## Architecture Rules
1. Keep modules separated by responsibility:
   - Domain: entities, value objects, core business rules only.
   - Application: use cases, DTOs, interfaces.
   - Infrastructure: EF Core, persistence, messaging, external integrations.
   - Api: HTTP surface only.
2. Prefer minimal, composable code over early optimization.
3. Avoid implementing full business workflows until scope docs are approved.
4. Update docs when changing architecture or workflow contracts.
5. Keep naming explicit and beginner-friendly.
6. Keep the same workflow vocabulary, screen structure, and action hierarchy consistent across implementation and documentation.

## Validation Rules
1. Backend must build successfully.
2. Frontend must build successfully.
3. Health endpoint must remain available at /health.

## Common Commands
From repo root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

## Production Deploy
Production VPS path:

```bash
/opt/job-ticket-system
```

Deploy sequence:

```bash
git switch main
git pull --ff-only origin main
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
curl -fsS http://127.0.0.1:8080/health
curl -fsS https://dev.mudbugdigital.com/health
```

## Current Workflow Notes
1. Techs add parts directly to tickets.
2. Order requests are optional workflow support, not the default path.
3. There is currently no true stocked-parts operating model.
4. Parts and supply UX should emphasize catalog readiness and optional back-office review, not replenishment automation.

## Frontend Notes
1. Preserve existing route structure under manager pages.
2. Keep mobile layout working when changing manager/admin screens.
3. Prefer focused, workflow-oriented UI polish over broad rewrites.
4. Use the same labels and section order for the same concept across related screens unless the workflow truly differs.

## Safety Notes
1. Do not introduce demo/bootstrap behavior into production paths.
2. Do not enable production seed/bootstrap flags during normal deploys.
3. Keep changes narrow and validate before commit.