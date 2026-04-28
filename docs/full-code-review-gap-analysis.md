# Full Code Review and Gap Analysis (Pre-Manager/Admin Screens)

_Date: 2026-04-28_

## Scope and Method
This review covered backend architecture, auth/authorization, data model/migrations, business rules, API contract alignment, frontend employee workflow, tests, and documentation readiness for the next phase.

Validation and inspection methods included:
- Static code walkthrough of controllers/services/entity configuration/migrations/frontend routing/auth logic.
- Contract walkthrough against `docs/api-contract.md`.
- Existing test-suite execution plus targeted auth regression tests added in this task.

---

## Critical (must fix before next phase)

### Fixed in this task
1. **Authentication resilience bug: malformed stored password hash could trigger unhandled exception path.**
   - **Risk:** corrupted data could result in 500 during login instead of safe auth failure.
   - **Fix:** defensive handling added around password verification; malformed hashes now fail closed as unauthorized.
   - **Tests added:** integration test verifies malformed hash returns `401 Unauthorized`.

2. **Authentication policy gap: inactive employees could still authenticate.**
   - **Risk:** deactivated accounts could still obtain tokens.
   - **Fix:** login now requires `EmployeeStatus.Active`, and `/api/auth/me` only resolves active employees.
   - **Tests added:** integration test verifies inactive employee login is rejected.

### Remaining critical findings
- **None identified as unresolved blockers** from code-level review in this pass.

---

## Important (should fix before next phase)

### Fixed in this task
- None beyond the critical auth fixes above.

### Remaining / deferred
1. **Existing JWT tokens for users later archived/deactivated are not explicitly revoked server-side before token expiration.**
   - Current role policies validate claims; they do not centrally re-check active status for every request at token-validation time.
   - This can allow short-lived continued access if account state changes after token issuance.
   - **Recommendation:** add token-validation event (or centralized authorization handler) that enforces active/non-archived employee existence for protected requests.

2. **Reporting labor pricing uses current employee rate fields rather than immutable per-entry pricing snapshot semantics.**
   - Current invoice-ready/reporting totals derive labor rates from `Employee.BillRate`/`Employee.LaborRate` and `Employee.CostRate`.
   - If rate cards change later, historic totals may shift.
   - **Recommendation:** confirm intended labor pricing source of truth (e.g., `TimeEntry.HourlyRate` and/or dedicated snapshot fields) and align reporting + docs.

3. **Database indexing gaps for expected Manager/Admin reporting/list workloads.**
   - Several common lookup predicates requested for next phase are only partially indexed (e.g., `JobTickets` by `CustomerId`/`Status`/`EquipmentId`, `TimeEntries` open-entry pattern, `JobTicketParts` by status/part/job combinations, `JobTicketFiles` by job + related foreign keys).
   - **Recommendation:** add a dedicated index hardening migration before Manager/Admin UI implementation.

4. **`docs/api-contract.md` contains stale “Future API Groups” placeholders and still labels the document as “Initial.”**
   - Not breaking, but can mislead upcoming Manager/Admin screen planning.

---

## Nice-to-have (can defer)
1. **Service-layer style consistency:** some master-data list methods still use `ContinueWith` instead of `async/await` style used elsewhere.
2. **Controller-level request DTO usage consistency:** minor places where request payload members are superseded by context-derived actor IDs (safe, but can be clearer in request contracts/docs).
3. **Employee app UX for Manager/Admin users:** current behavior redirects non-employee roles away from employee-only routes to login messaging; functional but not ideal as role-specific portals are added.

---

## Confirmed Good (reviewed and acceptable)

1. **Layering and architecture direction**
   - Controllers are generally thin and delegate to application services.
   - DTOs are used for API payloads.

2. **Authorization boundaries**
   - `/health` remains unauthenticated.
   - Admin-only endpoints are protected with `AdminOnly`.
   - Manager/Admin workflows (reporting, approvals, archive paths) remain policy-protected.
   - Assigned-employee scoping exists for employee-sensitive job workflows.

3. **Enum stability**
   - `JobTicketStatus` and `JobTicketPriority` numeric values match required stable values.
   - Frontend display mappings use explicit numeric maps (not array indexes) with unknown fallbacks.

4. **File workflow safeguards**
   - Upload type allowlist in place (`jpg/jpeg/png/webp/pdf`).
   - File metadata stored in DB; storage provider persists content externally.
   - Local storage provider enforces root-path resolution checks against traversal.

5. **Time and part workflow guardrails**
   - Single-open-time-entry enforcement is present.
   - Manager authorization is enforced for time approval/rejection/adjustments.
   - Job-part approval/rejection bypass through generic employee update path is blocked.

6. **Health endpoint contract**
   - JSON response shape remains consistent with documented stabilization expectations.

---

## Open Questions (owner/product decision needed)
1. **Labor pricing source-of-truth:** should invoice reporting lock to captured per-entry rates, or intentionally float with employee master rates?
2. **Account deactivation semantics:** should deactivated/archived users be hard-blocked immediately across all existing tokens (strict revocation), or only on next login/token refresh?
3. **Manager/Admin pre-UI route UX:** until screens exist, what should authenticated non-employee users see in frontend app routing (neutral placeholder, redirect to separate app shell, or sign-out prompt)?

---

## Phase-readiness Summary
The codebase is generally stable for moving toward Manager/Admin screen implementation after resolving the **important** items above (especially token revalidation semantics, reporting labor-rate snapshot decision, and indexing hardening migration planning).
