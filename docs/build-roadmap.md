# Build Roadmap (Project Control Center)

## Source of Truth and Baseline
This roadmap is the project control center for delivery sequencing and merge-readiness.

Baseline reviewed state: [Scope Code Review and Stabilization Audit (2026-05-06)](./scope-code-review.md).

Post-merge reset state: [Post-Merge Roadmap Reset After Phase 3C/3D Validation (2026-05-06)](./post-merge-roadmap-reset.md).

## Current Phase
**Parts Purchase / Vendor Cost Tracking Phase 1 - Manager purchasing workbench.**

Interpretation as of **May 14, 2026**:
- Core backend/API workflows are implemented and validated.
- Employee mobile workflow is implemented and validated.
- Manager/Admin Phases 1 and 2 are implemented.
- Manager/Admin **Phase 3A archive-confirmation slice is implemented**.
- Manager/Admin **Phase 3B master-data lifecycle coverage is implemented**.
- Manager/Admin **Phase 3C reports polish/export is implemented** with a polished Manager/Admin reports hub, supported filters, export-friendly tables, UTC lifecycle date columns on export-oriented rollups, explicit Snapshot/Fallback labels, and client-side CSV export.
- Manager/Admin **Phase 3D user-management polish and UX hardening is implemented** with safer Admin create/edit/deactivate/reset-password flows, clearer states, role-change confirmation, and regression tests.
- Phase 4A pilot readiness is implemented as opt-in local/demo seed data, a pilot runbook, and automated end-to-end workflow validation.
- Phase 4B pilot workflow polish is implemented as bounded frontend usability improvements for existing manager/admin job workflows.
- The first purchasing slice is now implemented as a Manager/Admin `/manage/purchasing` workbench over existing parts, vendors, categories, unit-cost, quantity-on-hand, and reorder-threshold data.
- This first purchasing slice intentionally stops short of purchase orders, receiving, vendor invoice tracking, landed cost, and advanced inventory transactions.

## Completed Scope
### Foundation and architecture
- Clean architecture layering in backend (`Domain`, `Application`, `Infrastructure`, `Api`).
- API-first implementation with policy-based authorization.
- Health endpoint contract retained at `GET /health`.

### Implemented capability surface
- Auth + role enforcement (`Admin`, `Manager`, `Employee`) and active-user token revalidation.
- Master data CRUD/archive surface (customers, service locations, equipment, vendors, part categories, parts).
- Job ticket lifecycle + assignments + work entries.
- Time tracking workflow with approval/rejection/adjustment and audit support.
- Job parts workflow with approval/rejection/archive behavior.
- Job ticket file upload/list/download/archive workflows.
- Reporting foundation endpoints (invoice-ready summaries, cost/labor/parts rollups, service history).
- Initial purchasing visibility over existing vendor, cost, stock-on-hand, and reorder-threshold part data.

### Frontend delivered
- Employee routes and workflows (`/login`, `/jobs`, `/jobs/:jobTicketId`).
- Manager/Admin shell and operational routes (`/manage` + section routes), including admin-only users route.
- Manager/Admin Phase 3A archive confirmation UX slice.
- Manager/Admin Phase 3B master-data lifecycle screens.
- Manager/Admin Phase 3C reports filters, tables, labor snapshot labeling, UTC lifecycle date rendering, and client-side CSV export.
- Manager/Admin Phase 3D Admin user-management polish, role-aware UX hardening, and regression coverage.
- Manager/Admin Phase 4B pilot workflow polish for job list filters, dashboard summary counts, and print-friendly job review.
- Shared router-aware future-flag test harness coverage for the current React Router baseline.
- Manager/Admin purchasing workbench for reorder-focused review, vendor/category/status filtering, and CSV export from loaded rows.

## Deferred Scope (Still Deferred)
The following remain deferred and must not be partially introduced outside the approved phase order:
- Purchase orders, receiving, vendor invoice tracking, and landed cost workflows.
- Advanced inventory workflows.
- Parts compatibility recommendation engine.
- AI/scoring-based part recommendations.

## Phase 4A Pilot Readiness (Implemented)
- Adds an opt-in `PilotDemoSeed` startup path for local/demo environments only.
- Seeded data includes Admin, Manager, and Employee users, requesting/billing customers, service location, equipment, parts/vendor/category records, and three representative pilot job tickets.
- The seed is idempotent and uses the `PILOT-4A` account-number marker to avoid duplicate local data.
- Automated tests validate employee assigned-job visibility, clock in/out, work notes, part usage, manager approvals, and reporting visibility.
- Full production seeding, dedicated purchasing records, advanced inventory intelligence, compatibility recommendations, and invoice/payment processing remain out of scope.

## Active Stabilization Concerns
From the reviewed live baseline:
1. **Remote git transport warning:** direct `git fetch`/`git ls-remote` can still return GitHub HTTP 403 from this workspace, so clone/fetch failures remain environment limitations rather than product-code findings.
2. **npm environment warning:** npm emits `Unknown env config "http-proxy"`; it is warning-level because frontend install/build/test still pass.
3. **Router future config discipline:** app and test harnesses now share the same router future configuration; future frontend tests should keep using that shared path instead of reintroducing ad hoc router wrappers.
4. **Purchasing phase discipline:** keep the current purchasing slice anchored to existing master-data APIs until a separate, explicit purchase-order/receiving phase is scoped.

## Immediate Hygiene Item
Keep the validated Phase 4 baseline intact while expanding only the approved purchasing scope. The 2026-05-06 remote-provenance merge-readiness pass is documented in [Remote Provenance Merge-Readiness Validation](./remote-provenance-merge-readiness.md), and the follow-up roadmap reset is documented in [Post-Merge Roadmap Reset After Phase 3C/3D Validation](./post-merge-roadmap-reset.md).

## Recommended Feature Order
1. Finish Parts Purchase / Vendor Cost Tracking Phase 1 with docs, validation, and any bounded follow-up polish on the purchasing workbench.
2. Continue Parts Purchase / Vendor Cost Tracking Phase 2 with dedicated purchasing records for purchase orders, receiving, vendor invoice tracking, and landed cost.
3. Add Advanced Inventory workflows only after the purchasing records phase is stable.
4. Re-assess Parts Compatibility Recommendation Engine entry only after purchasing and inventory foundations are complete.

## Planned Sequence: Manager/Admin Phase 3A → 3D
### Phase 3A (Completed)
- Archive confirmation UX slice for manager/admin job ticket detail.
- No API/auth/schema changes required.

### Phase 3B (Completed)
- Delivered end-to-end manager/admin master-data lifecycle coverage across existing APIs for list/detail/create/update/archive/unarchive flows.
- Added archived-record list visibility through `includeArchived=true` and `isArchived` DTO fields so Manager/Admin users can complete unarchive workflows without exposing EF entities.
- Endpoint usage remained within existing API groups; no deferred purchasing, vendor-cost, advanced-inventory, AI/scoring, or recommendation domains were introduced.
- No migrations were added.

### Phase 3C (Implemented)
- Reports polish/export workflow is present for Manager/Admin operations.
- Added a reports hub for invoice-ready summary, job cost summary, jobs ready to invoice, labor by job, labor by employee, parts by job, customer service history, and equipment service history.
- Added supported report filters, export-friendly table rendering, loading/empty/error states, existing-route drill-in links, and client-side CSV export from loaded report data.
- Added explicit labor snapshot/fallback labeling in reports UI and UTC lifecycle date rendering for export-oriented rollups; role boundaries and routing model unchanged.
- No backend reporting rule changes, migrations, or new business domain introduction.

### Phase 3D (Implemented)
- Polished the Admin-only user-management page with table layout, create/edit flows, active/inactive role display, loading/empty/success/error states, and validation messaging.
- Added confirmation gates for deactivation, password reset, and role changes that affect access immediately.
- Kept `/manage/users` Admin-only and preserved Manager/Admin vs Employee route boundaries.
- Added focused frontend regression coverage for Admin user-management and route authorization behavior.
- No backend contract changes, migrations, or deferred-domain behavior were added.

## Parts Purchase / Vendor Cost Tracking Phase 1 (Current)
- Added a Manager/Admin purchasing workbench at `/manage/purchasing` using existing master-data endpoints only.
- Derived reorder-ready rows from current part `quantityOnHand`, `reorderThreshold`, `unitCost`, `vendorId`, and category relationships.
- Added search, vendor/category/status filters, summary counts, and client-side CSV export from already loaded rows.
- No new backend purchasing endpoints, purchase-order entities, receiving workflows, landed-cost calculations, migrations, or auth changes were added in this slice.

## Validation Requirements Before Merge
Run these standard checks from repo root:

```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```

Merge-readiness requires:
- Backend build green
- Frontend build green
- Backend/frontend tests green (or explicitly documented environment limitation)
- `/health` endpoint contract retained
- No unauthorized scope expansion into deferred domains

## Readiness for Next Workstream
Concise readiness statement:
- The live baseline is complete through Phase 4B and now includes the first purchasing workbench slice.
- Phase 3A, 3B, 3C, 3D, 4A, and 4B slices remain complete on the current control baseline.
- Proceed next with bounded purchasing/vendor-cost slices before advanced inventory or recommendation work.
- Continue to enforce no-migration and no-auth-weakening constraints unless a later approved phase explicitly requires otherwise.

## Cross-Linking
- Post-merge roadmap reset: [docs/post-merge-roadmap-reset.md](./post-merge-roadmap-reset.md)
- Latest scope review: [docs/scope-code-review.md](./scope-code-review.md)
- Prior baseline review: [docs/project-pickup-review.md](./project-pickup-review.md)
- Scope contract: [docs/project-scope.md](./project-scope.md)
- API contract: [docs/api-contract.md](./api-contract.md)
- Setup/validation commands: [docs/development-setup.md](./development-setup.md)
- Top-level orientation: [README.md](../README.md)

## Phase 4B Pilot Workflow Polish (Implemented)
- Manager/Admin job tickets now have bounded client-side search and filters for status, priority, and customer using already-loaded ticket/master-data responses.
- Manager/Admin dashboard now shows a small operational job summary from existing job list data: open, assigned, in-progress, waiting-on-parts, completed/review-ready, and invoice-ready counts.
- Manager/Admin job detail now presents clearer job review sections for labor/work, time, parts usage, files/photos, status/priority, and browser print support with print-only CSS behavior.
- No backend contracts, authorization policies, enum numeric values, migrations, production seeding, server-side exports, or deferred product domains were added in this phase.

## Parts Purchase / Vendor Cost Tracking Phase 2 (Implemented in current slice)
- Added dedicated purchase-order and purchase-order-line persistence for vendor purchasing records.
- Added Manager/Admin API coverage for list/detail/create/update/submit/receive/cancel/archive/unarchive purchase-order workflows.
- Added vendor invoice tracking fields and landed-cost recording fields for freight, tax, other landed costs, and landed-cost notes.
- Added Manager/Admin purchasing UI coverage for creating purchase orders, reviewing line details, recording receiving quantities, and saving vendor invoice/landed-cost details.
- Added a schema migration for the new purchasing records tables.
- Explicitly kept advanced inventory, warehouse/truck inventory, inventory ledgers, replenishment automation, recommendation logic, AI/scoring, and auth model changes out of scope.
