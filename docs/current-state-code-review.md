# Current-State Code Review & Gap Analysis (2026-04-29)

## Scope
This review is a stabilization/readiness pass before roadmap/control-center planning and before Manager/Admin Phase 3A. It focuses on correctness, security, authorization, integrity, frontend/backend contract alignment, routing boundaries, test coverage, and documentation readiness. No new feature domains were implemented.

## Validation Run
1. `dotnet restore backend/JobTicketSystem.sln` ✅
2. `dotnet build backend/JobTicketSystem.sln` ✅
3. `dotnet test backend/JobTicketSystem.sln` ✅ (83 passed)
4. `cd frontend && npm install` ✅
5. `cd frontend && npm run build` ✅
6. `cd frontend && npm test` ✅ (21 passed)

## Critical (must fix before roadmap / Phase 3A)
- **None confirmed in this pass.**

## Important (should fix before Phase 3A)
1. **React Router v7 future-flag warnings still present in frontend tests.**
   - Risk: future upgrade friction and noisy CI output.
   - Recommendation: set router future flags or complete migration plan before Phase 3A UI expansion.
   - Status: documented, not blocking.

2. **Main-branch baseline verifiability depends on repository workflow policy.**
   - Only local `work` branch is present in this environment, so baseline was validated against current checked-out branch state.
   - Recommendation: maintain explicit CI note linking this stabilization review to merge-base SHA when executing in constrained environments.
   - Status: documented process gap, not product-code blocker.

## Nice-to-have (can defer)
1. Expand frontend tests for API error UX (400/401/403/404) per page-level scenarios.
2. Reduce repeated React Router warnings in tests for cleaner regression output.
3. Add explicit checklist entry in docs for enum-map verification when adding UI status/priority displays.

## Confirmed good (reviewed and acceptable)
1. **Backend enum numeric stability** matches required values.
2. **Policy boundaries** are in place for Admin-only, Manager/Admin, Employee-or-above, and assignment-aware routes.
3. **Health endpoint** remains present and validated in integration tests.
4. **Test coverage includes key hardening areas** (auth/token behavior, assignment boundaries, parts/time workflow protections, file workflow, reports, and routing).
5. **Frontend routing and role guards** are covered by auth/routing regression tests and manager/admin route tests.
6. **Employee-safe and manager/admin workflows** remain segregated by API/controller policy and role-aware frontend routes.
7. **Validation baseline is green** for backend and frontend build/test commands.

## Open questions (owner/product decision)
1. Should React Router v7 future flags be enabled now (pre-Phase 3A) or deferred to a dedicated routing-upgrade mini-phase?
2. Should the stabilization checklist require an explicit merge-base SHA entry whenever remote `main` is unavailable in review environments?

## Deferred domains confirmation
The following deferred domains remain **not implemented** in this review task:
- Parts purchase/vendor cost tracking
- Advanced inventory
- Parts compatibility recommendation engine / AI scoring

## Migrations
- No migrations added.

## Readiness summary
The codebase is currently stable for roadmap/control-center documentation and for starting Manager/Admin Phase 3A planning, with no confirmed critical blockers from this pass. Addressing React Router warning cleanup is recommended before broader Phase 3A UI growth.
