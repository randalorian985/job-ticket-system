# Wiki Screenshot Refresh - June 22, 2026

This note tracks the screenshot impact of the Employee clock-in-first and Manager/Admin compact queue update.

## Screenshots To Refresh From Preview Or Post-Merge VPS

Refresh these wiki assets from the approved preview environment or from the VPS after the PR is merged to `main`:

- `docs/assets/system-wiki/employee-jobs.png`
- `docs/assets/system-wiki/employee-job-detail.png`
- `docs/assets/system-wiki/job-ticket-queue.png`
- `frontend/public/docs/assets/system-wiki/employee-jobs.png`
- `frontend/public/docs/assets/system-wiki/employee-job-detail.png`
- `frontend/public/docs/assets/system-wiki/job-ticket-queue.png`

## Expected Visual Changes

- Employee assigned jobs should show concise cards only, with no assigned-work summary dashboard and no separate "Next up" panel.
- Employee job detail should show ticket context, the "Before You Start" review, and the clock-in card before field tools.
- Employee job detail should show notes, Add / Request Part, upload, work entries, parts, and files only after the technician is clocked into that exact ticket.
- Manager/Admin job-ticket queue should show the **Rich cards** and **Compact list** toggle.
- Compact list should prioritize ticket, customer/location, assigned tech, status, priority, scheduled date, due date, and Open action.

## June 23, 2026 Workflow Simplification Note

- The wiki screenshot index no longer references Dispatch board screenshots because Dispatch is no longer a standalone Manager/Admin module.
- Refresh `manager-dashboard.png` so it shows the quiet summary dashboard without the workspace shortcut wall.
- Refresh `job-ticket-queue.png` so it shows the compact **Quick Views** row and the Status dropdown for Admin-configured status labels.
- Keep the older `dispatch-board*.png` assets out of the wiki unless a future approved workflow reintroduces a separate board.

## Guardrails

- Capture screenshots with demo or pilot data only.
- Do not use production customer data in screenshots.
- Do not deploy this draft PR directly to production for screenshot capture.
- If screenshots are captured from the VPS, use the post-merge checklist in `docs/production-readiness-runbook.md` first.
