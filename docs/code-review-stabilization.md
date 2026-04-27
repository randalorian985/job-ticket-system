# Code Review & Stabilization Report (2026-04-27)

## Scope Reviewed
- Backend architecture and layering (controllers/services/DTO boundaries).
- Authorization and security policy enforcement.
- EF model + migration health checks.
- Core workflow business rules (job lifecycle, assignment, time, parts, files).
- Frontend employee workflow and API/DTO consistency.
- Documentation alignment (`README`, `docs/api-contract.md`, `docs/project-scope.md`).
- Build/test execution status for backend and frontend.

## Critical (must fix before next phase)
1. **Employee could change part approval state through generic part update endpoint.**
   - Risk: bypass of intended Manager/Admin approval workflow.
   - Fix applied: service now blocks approval-status changes for non-manager users and blocks manager override flag for non-manager users.
   - Files: `backend/src/Application/JobTickets/JobTicketServices.cs`.
   - Coverage added: integration test ensuring employee cannot approve part through update endpoint.

## Important (should fix before next phase)
1. **File upload response used route-generation-based Created response.**
   - Risk: upload could persist successfully but return an unstable response if route generation changes/fails.
   - Fix applied: upload endpoint now returns deterministic `201 Created` with `Location: /api/job-tickets/{jobTicketId}/files/{fileId}`.
   - Files: `backend/src/Api/Controllers/JobTicketFilesController.cs`.
   - Coverage added: integration test validates `201`, non-empty location header, and safe API URL that does not expose storage internals.

2. **Time-entry adjustment authorization was not enforced at service layer.**
   - Risk: direct service invocation could bypass controller authorization attributes.
   - Fix applied: `AdjustAsync` now enforces Manager/Admin authorization in the application service.
   - Files: `backend/src/Application/TimeEntries/TimeEntryServices.cs`.
   - Coverage added: service test validates an Employee-role caller cannot adjust entries through direct service invocation.

3. **Frontend job status/priority labels were misaligned with backend enum numeric values.**
   - Risk: incorrect UI display and operator confusion.
   - Fix applied: updated employee job list label maps to match backend enum values.
   - File: `frontend/src/pages/employee/MyJobsPage.tsx`.

4. **Project scope doc had stale statements saying authentication/workflows were deferred or in-progress.**
   - Risk: onboarding and planning confusion.
   - Fix applied: updated scope status to reflect current implemented auth and employee workflow state.
   - File: `docs/project-scope.md`.

5. **API contract needed explicit note for part approval boundary.**
   - Risk: client teams might incorrectly rely on part-update endpoint for approval transitions.
   - Fix applied: added explicit note that approval transitions are manager/admin-only.
   - File: `docs/api-contract.md`.

## Nice-to-have (can defer)
1. Tighten integration-test logging noise from expected request failures to reduce false alarms in test output triage.
2. Expand frontend automated test coverage (currently no configured frontend unit/integration tests).
3. Add more explicit endpoint-by-endpoint cancellation token conventions to architecture docs.

## Confirmed good (reviewed and acceptable)
- Controllers are mostly thin and delegate workflow to application services.
- DTO usage is consistent for API contracts; EF entities are not returned directly.
- JWT auth wiring and policy registration are in place (`AdminOnly`, `ManagerOrAdmin`, `EmployeeOrAbove`, assignment-aware policy).
- Report endpoints are manager/admin-only.
- Employee-safe part lookup endpoint excludes cost fields.
- Password hash is persisted server-side and not exposed in API user/auth DTOs.
- File upload uses metadata + storage provider abstraction (no file bytes in SQL entity model).
- Soft-delete query filters are active and used with archive semantics.
- Decimal precision is configured for money, quantities, labor, and GPS coordinates.
- Required backend and frontend build/test commands complete successfully in this environment.
- Frontend test command is present but currently a placeholder indicating no tests configured yet.

## Commands Executed
1. `dotnet restore backend/JobTicketSystem.sln`
2. `dotnet build backend/JobTicketSystem.sln`
3. `dotnet test backend/JobTicketSystem.sln`
4. `cd frontend && npm install`
5. `cd frontend && npm run build`
6. `cd frontend && npm test`
