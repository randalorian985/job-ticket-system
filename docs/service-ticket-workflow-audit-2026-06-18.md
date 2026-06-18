# Service Ticket Workflow Audit - June 18, 2026

## Scope
This audit reviewed the Manager/Admin Service Ticket experience across desktop and mobile without redesigning the business workflow.

Reviewed documentation before coding:
- `README.md`
- `frontend/src/pages/README.md`
- `frontend/src/routes/README.md`
- `docs/system-wiki.md`
- `docs/project-scope.md`
- `docs/api-contract.md`
- `docs/build-roadmap.md`
- existing screenshots in `docs/assets/system-wiki`

## Summary
The ticket workflow remains ticket-backed and uses the existing Manager/Admin workbench, workflow tabs, action panels, and APIs. The audit found visibility and focus gaps, not broken persistence or missing backend workflow.

Implemented repairs:
- workflow tabs and action shortcuts now open the selected workflow with `view=workflow`;
- quick-action drawers receive focus when opened;
- workflow panel focus no longer steals focus from open drawers;
- **Back to ticket overview** closes any open focused drawer;
- global ticket errors announce as alerts;
- active workflow tabs and focused drawers have stronger shared contrast/focus styling.

No backend API, schema, migration, enum, role, permission, auth, purchasing, receiving, vendor invoice, landed cost, inventory expansion, recommendation/scoring/AI, automatic compatibility, automatic approval, invoice-generation, payment, or customer portal scope was introduced.

## Ticket Navigation Audit
| Tab | Click registers | Active state | Content visible | Mobile behavior | Result |
| --- | --- | --- | --- | --- | --- |
| Service Details | Yes | Yes | Customer, location, equipment, scope, billing, status panels visible | Focused view keeps content under tabs | Passed after focus repair |
| Dispatch | Yes | Yes | Assignment list, lead, assignment form, dispatch readiness visible | Focused view avoids scrolling past rail | Passed |
| Labor | Yes | Yes | Labor totals, work entries, time entries visible | Add Labor now opens focused Labor view | Passed after focus repair |
| Parts | Yes | Yes | Parts summary, current parts, Add / Request drawer visible | Focused Parts view keeps add/request form visible | Passed after focus repair |
| Files | Yes | Yes | Files/photos list visible | Add Photo opens focused Files workflow with upload panel | Passed after focus repair |
| Invoice Review | Yes | Yes | Closeout checks and invoice-ready report totals visible | Focused view avoids hidden closeout content | Passed |
| History | Yes | Yes | Work notes, time, parts, and file activity visible | Add Note opens focused History workflow | Passed after focus repair |

## Ticket Actions Audit
| Action | Expected behavior | Finding | Implemented fix |
| --- | --- | --- | --- |
| Edit Ticket | Open section-based editor | Opened correctly, but could appear below overview rail on mobile | Opens focused Service Details workflow and focuses editor panel |
| Change Status | Open guarded status review | Opened correctly, but drawer focus was not guaranteed | Opens focused status panel and focuses drawer |
| Add Note | Open note panel and save work entry | Opened correctly, but target could be below rail | Opens focused History workflow and focuses note panel |
| Add Photo | Open upload panel and save file | Opened correctly, but target could be below rail | Opens focused Files workflow and focuses upload panel |
| Add Labor | Open labor/time review | Changed active tab, but mobile users could remain above the target panel | Opens focused Labor workflow |
| Open Add / Request Part Panel | Open in-ticket part/request form | Opened correctly, but target could be below rail | Opens focused Parts workflow and focuses drawer |
| Archive Review | Open archive impact/reason panel | Opened correctly, but drawer focus was not guaranteed | Opens focused archive panel and focuses drawer |
| Back to ticket overview | Exit focused workflow | Did not close an open focused drawer | Now clears active drawer and removes `view=workflow` |

## Workflow Cards Audit
| Card | Verification | Result |
| --- | --- | --- |
| Dispatch | Status, ready/open check counts, lead/assignment details, and warnings derive from loaded ticket assignments and schedule data | Passed |
| Closeout | Open requirement count derives from closeout readiness checks | Passed |
| Parts | Blocker, Needs ordered, pending review, and ticket-only counts derive from ticket parts | Passed |
| Labor | Approved labor and time-entry counts derive from time entries | Passed |
| Files/Photos | Attached-file and invoice-attachment counts derive from ticket file list | Passed |
| Invoice Review | Uses existing invoice-ready report summary when available and surfaces unavailable summary messaging | Passed |

## Accessibility And Mobile Audit
Issues found:
- active workflow tab contrast was present but could be stronger;
- opened drawers lacked a reliable focus outline and programmatic focus target;
- workflow panel focus could override drawer focus;
- global ticket errors did not announce with `role="alert"`;
- mobile action shortcuts could require extra scrolling to find the target workflow.

Repairs:
- active workflow tabs now use a higher-contrast selected state;
- drawers have focusable IDs and shared focus-visible styling;
- drawer focus wins over workflow panel focus;
- global error messaging uses `role="alert"`;
- tab and action navigation enters focused workflow mode where appropriate.

## Root Cause Analysis
| Symptom | Root cause | Affected users | Implemented fix |
| --- | --- | --- | --- |
| Add Labor changed the tab but users could still need to scroll past overview content on mobile | Action only selected `tab=time`; it did not set `view=workflow` | Dispatchers, managers, office staff on mobile | Direct tab/action selection now sets focused workflow mode |
| Quick-action panels could feel hidden below the page rail | Drawers rendered in the main workbench while the rail remained visible in normal mode | Mobile and keyboard users | Action shortcuts open focused workflow views and focus the drawer |
| Open drawer focus was unreliable | Drawers had no stable focus target and panel focus ran after tab changes | Keyboard and assistive-technology users | Drawers receive IDs, `tabIndex=-1`, and focus; panel focus skips when a drawer is active |
| Back to ticket overview left a drawer open | The close handler only removed the URL `view` parameter | All Manager/Admin users | The close handler clears `activeDrawer` before removing focused mode |
| Error feedback could be missed by assistive tech | Global error paragraph lacked alert semantics | Screen-reader users | Global errors now use `role="alert"` |

## Screenshots Updated
Updated or added screenshots in `docs/assets/system-wiki` and `frontend/public/docs/assets/system-wiki`:
- `job-ticket-workspace.png`
- `ticket-section-editor.png`
- `ticket-quick-note.png`
- `ticket-status-review.png`
- `ticket-labor-workflow.png`
- `ticket-parts-workflow.png`
- `ticket-workspace-mobile.png`
- `ticket-edit-mobile.png`
- `ticket-labor-mobile.png`
- `ticket-parts-mobile.png`

Screenshots were captured from the real frontend route with mocked API responses so no live ticket data was created or changed.

## Regression Tests
Focused frontend regression coverage was updated in `frontend/src/pages/manager/JobTicketDetailPage.test.tsx`.

Covered behavior:
- workflow tabs select the expected panels;
- Add Note, Add Photo, Add Labor, Change Status, Archive Review, and Add / Request Part remain functional;
- opened drawers receive focus;
- focused workflow mode exposes **Back to ticket overview**;
- backing out of focused mode closes open drawers;
- API validation errors remain surfaced.

## Database Impacts
None.

## API Impacts
None. The ticket workflow continues to use the existing ticket update, status, archive, assignment, work-entry, file, part request, time-entry, master-data, and invoice-ready report APIs.

## Remaining Recommendations
- Add a reusable screenshot script if documentation screenshots continue to be updated frequently.
- Add a browser-based CI smoke test for the Manager/Admin ticket route with API mocks.
- Continue keeping dispatch as the parent operational workflow and ticket review as the closeout/detail workflow until an approved backend dispatch model exists.
