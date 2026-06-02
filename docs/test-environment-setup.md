# Test Environment Setup

This guide explains how to prepare test environments for the Crane / Job Ticket System when the database starts empty, when full local pilot seed data is desired, and when the scheduled runner cannot perform a normal GitHub checkout.

Use this together with:
- [Development Setup](./development-setup.md)
- [Local Demo Runbook](./local-demo-runbook.md)
- [Scheduled Runner Workaround](./scheduled-runner-workaround.md)

## Role model

The application currently uses canonical role strings on employee/user records rather than a separate role table.

The base roles are:

| Role | Purpose |
| --- | --- |
| `Admin` | Top-level administrative access, including `/manage/users`. |
| `Manager` | Manager/Admin operational workflows under `/manage`, excluding Admin-only user management. |
| `Employee` | Employee mobile workflow for assigned jobs. |

Do not rename these roles or introduce new role values for test convenience. Authorization policies depend on these canonical values.

## Minimal test bootstrap without full seed data

Use `TestBootstrap` when a test or local environment needs a loginable top-level Admin but does not need full pilot demo data.

This path creates one active Admin employee only when no active Admin exists. It does not create customers, service locations, equipment, job tickets, parts, purchase orders, or inventory records.

Default bootstrap credentials when enabled:

| Role | Username | Password | Email |
| --- | --- | --- | --- |
| Admin | `test.admin` | `TestAdmin123!` | `test.admin@example.local` |

Enable it only in local or test environments:

```bash
TestBootstrap__Enabled=true \
TestBootstrap__MigrateDatabase=true \
TestBootstrap__AdminUserName=test.admin \
TestBootstrap__AdminEmail=test.admin@example.local \
TestBootstrap__AdminPassword='TestAdmin123!' \
  dotnet run --project backend/src/Api/Api.csproj
```

Recommended use:
- empty local database smoke tests;
- integration environments where full pilot data would make assertions noisy;
- verifying login, JWT issuance, `/api/auth/me`, `/manage`, and `/manage/users` access boundaries.

Safety rules:
- keep `TestBootstrap:Enabled` disabled in committed settings and production-like environments;
- override the default password when the environment is shared;
- remove or reset the local database after a shared test session;
- do not use `TestBootstrap` to bypass normal Admin user-management workflows in production.

If an active Admin already exists, bootstrap does not create another one. If there is no active Admin but the configured username or email conflicts with a non-admin employee, startup fails so the conflict can be fixed deliberately.

## Full seeded pilot data

Use `PilotDemoSeed` when a reviewer needs representative data for a local walkthrough or end-to-end workflow smoke test.

Enable it only for local/demo databases:

```bash
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=JobTicketSystem;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True" \
PilotDemoSeed__Enabled=true \
PilotDemoSeed__MigrateDatabase=true \
  dotnet run --project backend/src/Api/Api.csproj --urls http://localhost:5000
```

Pilot credentials:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `pilot.admin` | `PilotDemo123!` |
| Manager | `pilot.manager` | `PilotDemo123!` |
| Employee | `pilot.tech` | `PilotDemo123!` |

Seeded job tickets:
- `PILOT-READY-001`: completed ticket with approved labor/part lines and invoice-ready reporting data.
- `PILOT-ACTIVE-002`: employee-assigned ticket for clock-in/out, work notes, parts, and file/photo walkthroughs.
- `PILOT-PARTS-003`: waiting-on-parts ticket with a pending part line for manager review.

Do not enable `PilotDemoSeed` in production-like environments. It intentionally creates demo customers, equipment, tickets, users, parts, and related workflow records.

## Choosing between bootstrap and seed data

| Need | Use |
| --- | --- |
| Login to an otherwise empty database as Admin | `TestBootstrap` |
| Verify auth and Admin route boundaries without workflow data | `TestBootstrap` |
| Demo employee, manager, ticket, part, time, and report workflows | `PilotDemoSeed` |
| Validate realistic seeded end-to-end workflow coverage | `PilotDemoSeed` |
| Shared or production-like environment | Neither, unless explicitly approved and credentials are rotated |

Do not enable both unless a specific test needs both. If both are enabled, `TestBootstrap` runs first and may create `test.admin`; `PilotDemoSeed` can then create the separate pilot Admin/Manager/Employee users.

## Validation commands

Run standard validation in a checkout-capable environment before calling a PR merge-ready:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

Focused backend validation for this bootstrap path:

```bash
dotnet test backend/JobTicketSystem.sln --filter TestEnvironmentBootstrapTests
```

Focused pilot seed validation:

```bash
dotnet test backend/JobTicketSystem.sln --filter PilotDemoSeedTests
```

## Scheduled runner and checkout workarounds

The scheduled ChatGPT runner may be unable to use normal GitHub network paths such as `git clone`, `git fetch`, `curl`, raw GitHub downloads, codeload, or GitHub CLI workflows. When that happens, do not stop at the blocker if a safe workaround exists.

Use this order:

1. Check for an active PR and keep one active PR moving.
2. Use the GitHub connector for PR metadata, file reads, branch creation, file updates, comments, review state, and GitHub Actions status.
3. If normal checkout is blocked, use the scheduled-runner workspace bundle bridge documented in [Scheduled Runner Workaround](./scheduled-runner-workaround.md).
4. If connector output is too large to inline, use the offloaded connector output file, targeted chunk extraction, or narrower connector file reads.
5. Use GitHub Actions as the validation authority when local validation cannot run.
6. Record a blocker only after documenting which workarounds were attempted and why they were insufficient for the current task.

Current known workaround:
- GitHub Actions posts `scheduled-runner-bundle` manifest and chunk comments to issue #166 for the latest `main`.
- The scheduled runner can reconstruct a checkout-like workspace from those chunks when normal GitHub checkout remains blocked.
- Connector-created PRs must not be called merge-worthy until GitHub Actions or another checkout-capable environment has passed required validation.

## Environment reset guidance

For Docker-backed local SQL Server:

```bash
docker compose down -v
docker compose up -d
```

Then run either the minimal bootstrap or full pilot seed startup command above.

For in-memory integration tests, each test factory should use a unique database name so bootstrap and seed state cannot leak between tests.
