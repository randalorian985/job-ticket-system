# Scope Code Review and Stabilization Audit

## Review date
2026-05-06

## Branch and Git provenance
- Starting directory was confirmed as the repository root because `backend/JobTicketSystem.sln`, `frontend/package.json`, `README.md`, and `docs/` were present.
- Starting branch: `work`.
- HEAD before work: `c2c6d0959b913e25a2b9938daf771fe1bb427924`.
- Local `origin/main` ref before work: `c2c6d0959b913e25a2b9938daf771fe1bb427924`.
- Local merge-base before work: `c2c6d0959b913e25a2b9938daf771fe1bb427924`.
- Remote repair command was run once:
  - `git remote add origin https://github.com/randalorian985/job-ticket-system.git 2>/dev/null || git remote set-url origin https://github.com/randalorian985/job-ticket-system.git`
- `origin/main` was **not fetchable/verified** in this environment. Exact fetch error:

```text
error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
fatal: expected flush after ref listing
```

Because the fetch failed, this audit did not claim a freshly verified latest `origin/main` baseline. The current local branch was clean before review and the local `origin/main` ref matched HEAD, so the audit proceeded from that clean local snapshot.

## Review scope
This audit reviewed the Crane Job Ticket System against the approved in-scope foundation and explicitly excluded new feature domains. The review covered:
- Backend controllers, services, DTOs, authorization policies, EF Core configuration, migrations/model snapshot, file storage, reporting, auth/token revalidation, and regression tests.
- Frontend routes, protected-route boundaries, Employee workflow screens, Manager/Admin shell, master-data screens, Admin-only user management, reports UI, API clients, CSV export helper, labels, styles, and tests.
- CI/environment setup through `.github/workflows/dotnet.yml`, `.gitignore`, and `scripts/setup-codex.sh`.
- Documentation alignment in README and docs.

## Completed scope summary
The local snapshot is broadly on track for the current foundation/stabilization target.

Completed or represented scope:
- .NET 8 / ASP.NET Core backend solution with layered `Domain`, `Application`, `Infrastructure`, and `Api` projects.
- React + TypeScript + Vite frontend.
- EF Core persistence, migrations, and model snapshot.
- JWT authentication, Admin/Manager/Employee policies, current-user context, and active-user token revalidation.
- Employee mobile workflow: login, assigned jobs, job detail, clock in/out with GPS, work notes, job parts, and file/photo upload paths.
- Manager/Admin shell and protected Manager/Admin routes.
- Admin-only user management UI/API path.
- Customers, service locations, equipment, employees/users, vendors, parts, and part categories.
- Job tickets, assignments, work entries, time tracking, labor-rate snapshots, job parts workflow, file/photo uploads, invoice-ready reporting, and reporting summary endpoints.
- Master-data archive/unarchive behavior and equipment/part unarchive dependency validation.
- Manager/Admin reports UI and client-side CSV export are present in the local snapshot.

Partially complete or intentionally minimal scope:
- Manager/Admin master-data pages are functional but intentionally compact and not fully polished for all advanced search/picker interactions.
- Reports filters use supported ID/date/status fields and do not yet provide richer lookup widgets.
- File storage uses a local provider abstraction; production storage integration remains an infrastructure deployment decision.
- Setup docs/scripts are good enough for Codex and CI, but remote Git verification is still environment/auth dependent.

Implemented but requiring continued validation:
- Phase 3C reports polish/export is implemented and now passes local backend/frontend validation, but remote `origin/main` freshness could not be verified due to the GitHub HTTP 403 fetch failure.
- Phase 3D Admin user-management polish is present in the local snapshot even though no new Phase 3D work was requested for this audit. The audit only stabilized small defects; it did not add new Phase 3D feature scope.

## Phase 3C status classification
**Implemented and fully validated locally; remote-baseline verification blocked.**

Phase 3C evidence found:
- Reports hub, report cards/navigation, and report sections are present.
- Invoice-ready summary and job cost summary are present.
- Jobs ready to invoice, labor by job, labor by employee, parts by job, customer service history, and equipment service history are present.
- Supported filters are wired through the reports API client.
- Export-friendly tables, loading states, empty states, and error states are present.
- Client-side CSV export is present and covered by CSV escaping tests through the reports UI test.
- Labor snapshot/fallback labeling is present.
- Manager/Admin reports route protection is covered by route authorization tests.
- Backend reporting tests cover approved-only invoice/report rules and labor snapshot precedence.

Classification caveat: because `git fetch origin` failed with HTTP 403, this classification applies to the local snapshot only.

## Active pickup phase
**Stabilization/merge-readiness checkpoint for the locally implemented Manager/Admin Phase 3C/3D snapshot.**

Phase 3D is not the next feature task from this local snapshot because Phase 3D user-management polish is already present. The next correct task is a narrow stabilization/merge validation pass from a remotely fetchable `origin/main` baseline, followed by any small regression fixes found there. Do not start deferred domains.

## Critical findings
- **Remote provenance could not be verified.** `git fetch origin` failed with HTTP 403, so the review could not prove that the local `origin/main` ref was the true latest `main`.
- **Fixed: frontend invoice-status labels/filters were using legacy zero-based values.** Backend `InvoiceStatus` values are numeric 1-6, but the reports UI mapped `0/1/2/3` to user labels. This could send wrong report filters and display wrong invoice status labels.
- **Fixed: Admin user invalid reset-password payloads could escape as uncontrolled server errors.** The reset-password controller action now catches validation exceptions consistently, and user create/update validation now checks required user fields before trimming.

## Important findings
- Authorization boundaries remain strong: `/jobs` is Employee-only, `/manage` is Manager/Admin-only, `/manage/users` is Admin-only, and employee attempts to reach Manager/Admin screens render access denied.
- Backend reporting endpoints remain Manager/Admin-only.
- Employee-safe part lookup does not expose cost fields.
- File upload uses a deterministic API `Location` for 201 Created and does not expose storage keys or paths in response locations.
- Time-entry adjustment has service-layer Manager/Admin defense-in-depth.
- Employees cannot approve/reject job parts through the generic update endpoint.
- Malformed password hashes fail closed.
- Inactive users cannot log in, and existing JWTs for inactive users fail protected requests.
- `/health` remains unauthenticated and returns documented JSON.
- Migration/model snapshot consistency appears stable; no migrations were added.

## Nice-to-have findings
- Reports and master-data filters would benefit from user-friendly lookup selectors instead of ID-only inputs, but that is polish rather than stabilization.
- More direct tests could be added for every report mode's CSV columns, but current coverage verifies escaping and representative report export behavior.
- Setup documentation could include a short note that remote Git access may require external GitHub credentials even when local validation is green.

## Bugs fixed in this audit
1. Corrected Manager/Admin reports invoice-status labels and filter values to match backend enum numeric values (`NotReady = 1`, `Ready = 2`, `Drafted = 3`, `Sent = 4`, `Paid = 5`, `Void = 6`).
2. Added controlled Admin user validation responses for invalid create/update/reset-password payloads by validating required user fields before trimming and catching reset-password validation exceptions in the controller.
3. Added backend regression coverage for invalid Admin user payloads returning `400 Bad Request`.

## Bugs/gaps documented but deferred
- Remote provenance verification remains blocked until GitHub fetch access is available in the environment.
- Richer reports lookup UX is deferred.
- Production-grade file storage provider selection/configuration remains deployment scope.
- No broad refactor was attempted for compact Manager/Admin master-data page composition.

## Documentation sync findings
- README and build roadmap previously described the local snapshot as Phase 3D implemented, which matches the code, but did not include this scope-code-review checkpoint or the new stabilization fixes.
- Historical regression documentation needed an update for the Admin invalid payload and invoice-status label regressions fixed here.
- Project scope and API contract remain broadly accurate for current completed/deferred scope.

## CI/environment findings
- `.github/workflows/dotnet.yml` exists and runs backend restore/build/test against `backend/JobTicketSystem.sln`.
- Frontend CI commands use `working-directory: frontend` for install/build/test.
- `.gitignore` ignores TypeScript build info, node build output, .NET bin/obj output, local env files, logs, and test artifacts.
- `scripts/setup-codex.sh` skips remote Git operations as setup gates, installs or locates .NET 8, and runs backend/frontend validation.
- Local validation passed with an npm environment warning: `npm warn Unknown env config "http-proxy"`. This appears environment-related and did not fail install/build/test.

## Deferred-scope confirmation
No deferred domains were implemented in this audit. The following remain deferred:
- Parts Purchase / Vendor Cost Tracking
- Advanced Inventory
- Parts Compatibility Recommendation Engine
- AI/scoring-based recommendations
- Customer portal
- Accounting integration
- Payroll export
- Dispatch optimization

## Is Phase 3D safe to start?
No, not as a new feature task from this local snapshot. Phase 3D appears already implemented locally, and the next safe step is stabilization/merge validation from a fetchable remote baseline. If a future verified `origin/main` does not contain Phase 3D, then Phase 3D should only start after Phase 3C is confirmed merged and validation is green.

## Recommended next Codex task
**Run remotely verified stabilization and merge-readiness validation from latest `origin/main`.**

Suggested task prompt:

> Start from a successfully fetched latest `origin/main`, run full backend/frontend validation, verify that the Phase 3C reports and local Phase 3D Admin user-management stabilization fixes are present on the merge baseline, fix only small regressions, and prepare the branch for merge without adding deferred domains or new feature scope.
