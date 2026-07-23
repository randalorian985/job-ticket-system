# AGENTS.md

## Purpose
This repository is currently in scaffold phase. Keep contributions focused on foundational architecture and documentation.

## Working Rules
1. Keep modules cleanly separated:
   - `Domain`: entities/value objects and core business rules only.
   - `Application`: use cases, DTOs, interfaces.
   - `Infrastructure`: external integrations (EF Core, persistence, messaging).
   - `Api`: HTTP layer only.
2. Prefer minimal, composable code over early optimization.
3. Avoid implementing full business workflows until scope docs are approved.
4. Update `/docs` when changing architecture contracts.
5. Keep naming explicit and beginner-friendly.
6. Keep terminology, workflow states, screen hierarchy, and action labels consistent across the app and the steering docs.

## Codex Model Routing
- Follow [Codex Model Routing](./docs/codex-model-routing.md) when selecting a model and reasoning level for a task.
- Default bounded implementation work to GPT-5.6 Terra at High reasoning.
- Use GPT-5.6 Sol at Extra High reasoning for architecture decisions, migrations, backfills, historical-data rules, security boundaries, final risk review, and cutover planning.
- Use GPT-5.6 Luna only for low-risk mechanical work with deterministic validation.
- Model selection never bypasses a scope, steering, migration, reconciliation, or production approval gate.

## Validation
- Backend should build successfully.
- Frontend should build successfully.
- Health endpoint must remain available at `/health`.

## Tooling Notes
- Use the .NET SDK via the `dotnet` CLI.
- Common commands:
  - `dotnet --info`
  - `dotnet restore <solution-or-project>`
  - `dotnet build <solution-or-project>`
  - `dotnet test <solution-or-project>`
  - `dotnet run --project <path>`
