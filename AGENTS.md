# AGENTS.md

## Purpose
This repository contains an established field-service job-ticket application. It is not a greenfield scaffold. Agents must preserve working behavior, existing data, tenant isolation, authorization boundaries, and current operational workflows while making the smallest approved change.

## Required reading order
Before planning or changing repository content, read the applicable documents in this order:

1. `AGENTS.md` for repository-wide engineering and safety rules.
2. `docs/codex-model-routing.md` for task classification, agent/model routing, prompt inputs, and escalation rules.
3. `docs/slices/000-slice-planning.md` when the task belongs to the slice roadmap.
4. `docs/slices/STEERING.md` for shared slice sizing and execution rules.
5. The target child slice and its parent steering document.
6. Any applicable approved UI specification, architecture contract, runbook, or domain document.

Do not allow an older general document to override a newer canonical slice decision. Stop and record a conflict when the governing documents disagree materially.

## Existing-system rule
- Audit the current implementation before proposing or making changes.
- Reuse and repair existing models, migrations, APIs, services, routes, components, permissions, tests, and workflows before adding replacements.
- Do not create parallel Organization, Service Location, Person, Employee, Technician, Equipment, Work Order, assignment, scheduling, parts, reporting, navigation, or mobile systems.
- Preserve IDs, historical records, soft-delete/archive behavior, tenant boundaries, existing integrations, and compatible APIs unless an approved migration child explicitly changes them.
- Treat repository documentation as a description of the existing system, not permission to rebuild it from scratch.

## Architecture rules
1. Keep backend responsibilities separated:
   - `Domain`: entities, value objects, and core business rules.
   - `Application`: use cases, DTOs, interfaces, validation, and orchestration.
   - `Infrastructure`: EF Core, persistence, messaging, file storage, and external integrations.
   - `Api`: HTTP transport, authentication/authorization entry points, and thin controllers.
2. Keep business logic out of controllers and frontend presentation components.
3. Use DTO-based API contracts and preserve backward compatibility unless the target child explicitly authorizes a contract change.
4. Prefer explicit, composable code and existing project patterns over speculative abstraction.
5. Keep terminology, workflow states, screen hierarchy, and action labels consistent across code, tests, screenshots, wiki content, and steering documents.

## Identity and authorization boundaries
- Person is the shared human identity.
- Employee and Technician are roles or workforce profiles attached to Person, not competing identity records.
- Authentication accounts, authorization permissions, descriptive Person roles, and workforce eligibility are separate concepts.
- Preserve Employee and Manager/Admin route boundaries.
- Treat `/manage` as Manager/Admin-only and `/manage/users` as Admin-only.
- Treat `/manage/ticket-status-filters` and `PUT /api/ticket-status-filters` as Admin-only configuration surfaces.
- Do not expose cost, price, vendor, purchasing, inventory, catalog-administration, or invoice-facing billing controls to technicians.

## Operational scope boundaries
- Job Tickets remains the main Manager/Admin operating area for creating, assigning, scheduling, reviewing, and closing work.
- Do not introduce a separate Dispatch subsystem; dispatch behavior must reuse job-ticket backlog, assignment, and schedule data.
- A crane or equipment selection identifies the customer unit being serviced; it is not a company resource dispatch record.
- Keep purchasing expansion, receiving, warehouse/truck inventory, recommendations, AI/scoring, automatic compatibility, automatic approval, customer portals, online payments, and notification automation deferred unless explicitly selected by an approved slice.

## Slice execution rules
- Parent slices are steering documents only and are never executable implementation tasks.
- Every implementation or planning run must target exactly one child slice.
- Keep each branch, logical commit, pull request, validation report, and rollback boundary focused on one child.
- Follow documented child order and dependencies.
- Stop and propose a further split when the repository audit shows multiple independent outcomes, failure domains, migrations, or validation boundaries.
- Core master-data capability, reusable quick-create, caller integration, migration discovery, migration cutover, backend authorization, and frontend access administration must remain in their assigned children.

## UI rules
- UI planning children may not modify production components, CSS, routes, APIs, permissions, workflows, or database structures.
- Broad shell, navigation, page-anatomy, workbench, work-order workspace, or technician-mobile redesign remains blocked until UI-006-03 is approved.
- Before approval, business slices may make only narrow UI changes required to complete their capability and must use existing application patterns.
- After approval, production UI changes must conform to the approved information architecture, terminology, responsive behavior, accessibility requirements, and interaction patterns unless a reviewed exception is documented.

## Validation
Run the checks relevant to the changed child and report both successful and unavailable checks.

Common backend commands:

```bash
dotnet --info
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
```

Common frontend commands:

```bash
cd frontend
npm install
npm run build
npm test
```

Additional rules:
- Keep `GET /health` available.
- Validate migrations and data compatibility when persistence changes.
- Add focused unit, integration, end-to-end, accessibility, responsive, and security tests where applicable.
- Update the wiki and screenshots whenever user-visible behavior changes.

## Documentation and history
- `docs/slices/` is the only active slice-planning tree.
- Do not recreate a top-level `slices/` directory or another competing roadmap.
- Update architecture contracts and operational documentation when behavior changes.
- Use descriptive commit titles and bodies that state the logical outcome, not only the file operation.
- Git history preserves superseded plans; do not restore obsolete files solely to retain old guidance.
