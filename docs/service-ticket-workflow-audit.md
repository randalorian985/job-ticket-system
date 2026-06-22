# Service Ticket Workflow Audit

Date: June 18, 2026
Source: `Crane Job Ticket - Service Ticket Workflow Audit.pdf`
Repository state audited: `main` after fast-forward pull to `3531254`.

## Scope Audited

The audit focused on the existing Service Ticket workflow without changing the business process or adding a new navigation model.

Areas reviewed:
- Manager/Admin dashboard operations summary and dispatch readiness links.
- Manager/Admin job-ticket queue filters, dispatch readiness summaries, CSV export surface, and safe ticket return links.
- Manager/Admin Dispatch Board views, schedule panel, assignment controls, status actions, and ticket handoff links.
- Manager/Admin ticket workspace tabs: Service Details, Dispatch, Labor, Parts, Files, Invoice Review, and History.
- Ticket actions: Edit Ticket, Change Status, Add Note, Add Photo, Add Labor, Open Add / Request Part Panel, and Archive Review.
- Ticket workflow cards and panels: dispatch readiness, closeout, parts, labor/time, files/photos, invoice review, and activity.
- Employee mobile job detail, clock in/out, work notes, parts, file/photo upload, and field-work gating.
- Back-office Parts Request Queue filtering and request review.
- Documentation and screenshot references in the system wiki.

## Issues Found And Fixed

### 1. Parts Request Queue could stay loading after filtered reload failure

Symptom:
- Applying filters in the Parts Request Queue could fail without reliably clearing the loading state.
- Users could be left in the workflow without clear feedback after an API failure.

Root cause:
- `PartRequestsPage.load()` cleared `isLoading` only on successful request completion.
- The initial page load had a caller-level catch, but filter submissions called `load()` directly.

Affected screens:
- `/manage/part-requests`

Affected users:
- Manager/Admin users reviewing technician part requests.

Implemented fix:
- Moved queue load error handling into `PartRequestsPage.load()`.
- Added `try/catch/finally` so failed initial loads and failed filtered reloads both surface an error and clear the loading state.

Regression coverage:
- Added a test proving filtered queue load failures show `Unable to load part requests.` and do not leave the workflow in a loading state.
- Tightened the main parts request workflow test so it remains deterministic during full-suite runs.

### 2. Ticket workspace reload failures after actions could leave misleading state

Symptom:
- After a successful ticket action, a failed follow-up refresh could be treated as if the action itself failed.
- The ticket workspace could also remain in a loading state if a refresh failed outside the initial page-load path.

Root cause:
- `JobTicketDetailPage.load()` threw reload failures to each caller.
- Only the initial `useEffect` handled those failures and cleared loading.
- Action handlers such as status update, archive, assignment, note, photo/file upload, part request, and ticket edit all reused the same reload path.

Affected screens:
- `/manage/job-tickets/{jobTicketId}`

Affected users:
- Manager/Admin users working in the ticket workspace.

Implemented fix:
- Moved ticket reload error handling into `JobTicketDetailPage.load()`.
- Added `try/catch/finally` so all callers clear loading and surface either permission or general reload errors.
- Preserved the existing ticket tabs, action drawers, APIs, and workflow structure.

Regression coverage:
- Added a status-update regression test proving a successful status update followed by a failed refresh shows both the success message and `Unable to load job ticket details.`, while clearing the loading message.

### 3. Employee mobile post-action refresh failures could be reported as action failures

Symptom:
- If a technician successfully saved a mobile field action and the follow-up detail refresh failed, the UI could report the action as failed.
- This could mislead technicians after work-note, part, photo/file, clock-in, or clock-out actions.

Root cause:
- `JobDetailPage.refreshDetails()` was reused inside action `try` blocks.
- A refresh failure after the API action succeeded was caught by the action failure handler.

Affected screens:
- `/jobs/{jobTicketId}`

Affected users:
- Employee users on the mobile field workflow.

Implemented fix:
- Added a post-action refresh helper that catches refresh failures separately from action failures.
- Preserved the clock-in gate, existing part/request API behavior, and technician-safe field data.

Regression coverage:
- Added a mobile work-note regression test proving the work note API call succeeds, the UI reports `Work note saved, but refreshed job details could not be loaded. Refresh this page before continuing.`, and it does not show the generic work-note failure message.

### 4. Dashboard summary test could read async KPI content too early

Symptom:
- The dashboard operations-summary test failed intermittently by reading KPI content before the async summary load completed.

Root cause:
- The test waited for a static heading that renders before the summary data is loaded.

Affected screens:
- Automated regression coverage for `/manage`.

Implemented fix:
- Updated the test to wait for the operations KPI content itself.

## Verified Behavior

Automated tests now cover:
- Dashboard operations summary, dispatch readiness, and permission/error states.
- Ticket workspace tab selection, URL-backed tab restoration, and keyboard tab navigation.
- Ticket actions for status review, notes, photo/file upload, labor tab routing, parts request panel, archive review, assignment handling, and print review.
- Dispatch readiness and closeout guidance.
- Employee mobile clock-in gating, work-note recording, parts add/request behavior, file/photo controls, active-ticket conflicts, and post-action refresh feedback.
- Parts Request Queue filtering, back-office updates, catalog matching, cost/billable snapshots, billable flag, and reload failure feedback.
- Job-ticket queue and dispatch-board routing, filtering, scheduling, assignment, and day-of status behavior.

Browser smoke check:
- Frontend dev server rendered successfully at `http://127.0.0.1:5173/`.
- `/preview` rendered the local demo readiness page at desktop and mobile viewport widths without horizontal page overflow.
- `/manage` redirected unauthenticated users to `/login`, confirming protected route behavior still engages.
- `/login` rendered the sign-in form with Username or Email, Password, and Sign In controls in the mobile viewport.
- Seeded Manager/Admin and Employee browser walkthroughs were not run in this environment because SQL Server was not listening on `localhost:1433`, the Docker daemon was unavailable, and `http://localhost:5000/health` was not reachable.

## Documentation And Screenshots

Documentation updated:
- `docs/system-wiki.md`
- `frontend/public/docs/system-wiki.md`

Documentation change:
- The Validation And Error Behavior section now states that Manager/Admin ticket workspace refreshes, Employee mobile post-action refreshes, and Parts Request Queue filter reloads should clear loading states after failures and show useful feedback.

Screenshot status:
- The latest pulled repo already includes updated system-wiki screenshots for dashboard, dispatch, job-ticket queue, job-ticket workspace, section editor, employee mobile workflows, parts requests, reports, time approval, master data, purchasing, inventory, and admin users.
- No screenshot files changed in this repair pass because the implemented fixes affect error/loading behavior rather than stable layout.

## GitHub And VPS Update Status

GitHub:
- The service-ticket workflow repair branch has been merged into `main`.
- Current production-demo readiness follow-up is tracked in [Production Demo Readiness - 2026-06-22](./production-demo-readiness-2026-06-22.md).

VPS:
- VPS deployment is available through the source-controlled production Compose stack and runbook.
- The production runbook now includes the source-controlled `scripts/production-backup.sh` backup/verification flow for controlled demo operations.
- For each demo release, confirm container health and `/health` on both the local VPS proxy and public endpoint after pulling `main`.

## Files Changed

- `frontend/src/pages/manager/JobTicketDetailPage.tsx`
- `frontend/src/pages/manager/JobTicketDetailPage.test.tsx`
- `frontend/src/pages/employee/JobDetailPage.tsx`
- `frontend/src/pages/employee/__tests__/JobDetailPage.test.tsx`
- `frontend/src/pages/manager/PartRequestsPage.tsx`
- `frontend/src/pages/manager/PartRequestsPage.test.tsx`
- `frontend/src/pages/manager/ManagerDashboardPage.test.tsx`
- `docs/system-wiki.md`
- `frontend/public/docs/system-wiki.md`
- `docs/service-ticket-workflow-audit.md`

## Remaining Recommendations

- Run the production-demo checklist before each client handoff and record the deployed commit plus backup stamp.
- Capture dedicated error-state screenshots if the client wants troubleshooting visuals in the wiki.
- Consider a shared frontend async-load helper if more Manager/Admin pages develop the same loading/error pattern.
