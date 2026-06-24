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
- Employee job detail should show the new **Next action** card after readiness review; when clocked in, it should show Add Note, Add Part, Upload Photo, and Clock Out shortcuts.
- Employee job detail should show notes, Add / Request Part, upload, work entries, parts, and files only after the technician is clocked into that exact ticket.
- Manager/Admin job-ticket queue should show the **Rich cards** and **Compact list** toggle.
- Compact list should prioritize ticket, status/priority badges, customer/location, lead/team, readiness, timing, and one **Open Ticket** action.

## June 23, 2026 Workflow Simplification Note

- The wiki screenshot index no longer references Dispatch board screenshots because Dispatch is no longer a standalone Manager/Admin module.
- Refresh `manager-dashboard.png` so it shows the quiet summary dashboard without the workspace shortcut wall.
- Refresh `job-ticket-queue.png` so it shows the compact **Quick Views** row and the Status dropdown for Admin-configured status labels.
- Keep the older `dispatch-board*.png` assets out of the wiki unless a future approved workflow reintroduces a separate board.

## June 23, 2026 Tech/Admin UI Polish Note

- Refresh `employee-job-detail.png` so it shows the **Next action** card and the clock-in-first field tools.
- Refresh `job-ticket-queue.png` so the compact list shows the reduced row columns: ticket with badges, customer/location, lead/team, readiness, timing, and **Open Ticket**.
- No new Dispatch screenshots are needed because assignment and schedule remain part of Job Tickets.

## June 24, 2026 Full-Size Chrome Capture Note

- All wiki screenshot assets were re-captured through Chrome automation from the live VPS deployment.
- Desktop screenshots now use full-size captures (1920px-wide baseline with full-page height as needed).
- Mobile workflow screenshots were re-captured with a phone viewport and full-page height.
- Both screenshot directories were updated with matching files:
	- `docs/assets/system-wiki/*.png`
	- `frontend/public/docs/assets/system-wiki/*.png`
- Capture credentials used pilot/demo accounts only.

## June 24, 2026 Create-Ticket Assignment Screenshot Note

- Refreshed the Create Job Ticket Schedule-step screenshot with a full-width Chrome capture (1920px).
- New asset added in both wiki paths:
	- `docs/assets/system-wiki/create-job-ticket-schedule-assignment.png`
	- `frontend/public/docs/assets/system-wiki/create-job-ticket-schedule-assignment.png`
- The image shows optional technician assignment in Schedule, including selected technician summary and lead indicator.

## Guardrails

- Capture screenshots with demo or pilot data only.
- Do not use production customer data in screenshots.
- Do not deploy this draft PR directly to production for screenshot capture.
- If screenshots are captured from the VPS, use the post-merge checklist in `docs/production-readiness-runbook.md` first.
