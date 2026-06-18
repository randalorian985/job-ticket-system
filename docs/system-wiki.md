# Job Ticket System Wiki

## Purpose
This wiki explains how the Job Ticket System is used by Employees, Managers, and Admins. It is written for client handoff and operations training, not for software development.

The system is centered on field-service job tickets:
- create and manage service tickets;
- assign employees to work;
- let technicians clock in, record work, request parts, and upload photos/files;
- let Managers/Admins review work, time, parts, reports, users, and supporting master data;
- preserve role boundaries so each user sees the tools appropriate to their job.

Screenshots in this wiki are captured from the demo/pilot environment. They are intended to show screen layout and workflow behavior, not production customer data.

## Client Quick Start

For a first client walkthrough, use this order:

1. Start with [Roles And Access](#roles-and-access) so users understand what each account type can do.
2. Review [Sign-In And Session Behavior](#sign-in-and-session-behavior).
3. Walk technicians through [Employee Workflow](#employee-workflow).
4. Walk office staff through [Manager/Admin Workspace](#manageradmin-workspace).
5. Review [Time Tracking And Approval](#time-tracking-and-approval), [Parts And Part Requests](#parts-and-part-requests), and [Reports](#reports).
6. Finish with [Current Scope Boundaries](#current-scope-boundaries) so the client knows what is intentionally not included.

For live training, use the [Client Training Checklist](#client-training-checklist) near the end of this wiki.

## Screenshot Index

The screenshots below appear again in the workflow sections where they are most relevant:

| Screen | Screenshot |
| --- | --- |
| Login | [login.png](assets/system-wiki/login.png) |
| Employee assigned jobs | [employee-jobs.png](assets/system-wiki/employee-jobs.png) |
| Employee job detail | [employee-job-detail.png](assets/system-wiki/employee-job-detail.png) |
| Manager/Admin dashboard | [manager-dashboard.png](assets/system-wiki/manager-dashboard.png) |
| Dispatch board | [dispatch-board.png](assets/system-wiki/dispatch-board.png) |
| Dispatch unscheduled jobs | [dispatch-unscheduled-jobs.png](assets/system-wiki/dispatch-unscheduled-jobs.png) |
| Dispatch schedule workflow | [dispatch-schedule-job.png](assets/system-wiki/dispatch-schedule-job.png) |
| Mobile dispatch board | [dispatch-board-mobile.png](assets/system-wiki/dispatch-board-mobile.png) |
| Job-ticket queue | [job-ticket-queue.png](assets/system-wiki/job-ticket-queue.png) |
| Job-ticket workspace | [job-ticket-workspace.png](assets/system-wiki/job-ticket-workspace.png) |
| Section-based ticket editor | [ticket-section-editor.png](assets/system-wiki/ticket-section-editor.png) |
| Quick note workflow | [ticket-quick-note.png](assets/system-wiki/ticket-quick-note.png) |
| Status review workflow | [ticket-status-review.png](assets/system-wiki/ticket-status-review.png) |
| Labor workflow | [ticket-labor-workflow.png](assets/system-wiki/ticket-labor-workflow.png) |
| Parts add/request workflow | [ticket-parts-workflow.png](assets/system-wiki/ticket-parts-workflow.png) |
| Mobile ticket workspace | [ticket-workspace-mobile.png](assets/system-wiki/ticket-workspace-mobile.png) |
| Mobile ticket editor | [ticket-edit-mobile.png](assets/system-wiki/ticket-edit-mobile.png) |
| Mobile labor workflow | [ticket-labor-mobile.png](assets/system-wiki/ticket-labor-mobile.png) |
| Mobile parts workflow | [ticket-parts-mobile.png](assets/system-wiki/ticket-parts-mobile.png) |
| Time approval | [time-approval.png](assets/system-wiki/time-approval.png) |
| Parts requests | [part-requests.png](assets/system-wiki/part-requests.png) |
| Master data customers | [master-data-customers.png](assets/system-wiki/master-data-customers.png) |
| Purchasing support | [purchasing.png](assets/system-wiki/purchasing.png) |
| Reports hub | [reports-hub.png](assets/system-wiki/reports-hub.png) |
| Admin users | [admin-users.png](assets/system-wiki/admin-users.png) |

## Roles And Access

### Employee
Employees use the mobile-focused job workflow.

Employee users can:
- sign in;
- view jobs assigned to them;
- open assigned job details;
- review job readiness information;
- clock in and clock out with GPS;
- add work notes after clocking into the job;
- add or request parts after clocking into the job;
- upload job photos/files after clocking into the job;
- view work entries, parts/request status, and uploaded files for the assigned job.

Employee users cannot:
- view Manager/Admin workspace screens;
- manage users;
- manage master data;
- view part cost, billable price, vendor cost, purchase history, inventory controls, catalog cleanup, or invoice-facing billing controls.

### Manager
Managers use the Manager workspace for operational coordination.

Manager users can:
- view the dashboard;
- create and manage job tickets;
- assign employees;
- review job-ticket details and workflow tabs;
- review and update status/priority;
- review employee time entries;
- approve, reject, or edit-and-approve time entries;
- manage customer, location, equipment, vendor, part category, and part records;
- review part requests;
- use reports;
- use the existing purchasing-support screen.

Manager users cannot:
- access Admin-only user management;
- weaken role boundaries;
- perform hard deletes.

### Admin
Admins have Manager capabilities plus user administration.

Admin users can:
- create user accounts;
- edit user account information;
- deactivate/archive users;
- reset user passwords;
- filter users by search, role, and active/inactive status;
- access all Manager/Admin operational screens.

## Navigation Overview

### Public And Login
- `/login`: sign-in screen.
- `/health`: public system health endpoint.
- `/api/system/info`: public system information endpoint.

### Employee Routes
- `/jobs`: employee assigned jobs list.
- `/jobs/{jobTicketId}`: employee job detail and field-recording workflow.

### Manager/Admin Routes
- `/manage`: Manager/Admin dashboard.
- `/manage/dispatch`: dispatch board for scheduling, assignment, day-of status movement, ticket review, and billing readiness handoff.
- `/manage/job-tickets`: job-ticket queue.
- `/manage/job-tickets/new`: create job ticket.
- `/manage/job-tickets/{jobTicketId}`: job-ticket workspace.
- `/manage/customers`: customers.
- `/manage/service-locations`: service locations.
- `/manage/equipment`: equipment.
- `/manage/parts`: parts, vendors, and part categories.
- `/manage/part-requests`: parts request queue.
- `/manage/purchasing`: purchasing support.
- `/manage/parts-usage-history`: parts usage history visibility.
- `/manage/time-approval`: time approval queue.
- `/manage/parts-approval`: parts approval workflow.
- `/manage/reports`: reports hub.
- `/manage/users`: Admin-only user management.

## Sign-In And Session Behavior

1. The user opens the application and signs in with a username and password.
2. After sign-in:
   - Employee users are sent to `/jobs`.
   - Manager and Admin users are sent to `/manage`.
3. Protected routes require an authenticated user with the correct role.
4. Unauthorized users are redirected away from restricted screens.
5. Inactive, archived, or deleted users should not be allowed to continue using protected workflows.

![Login screen](assets/system-wiki/login.png)

## Employee Workflow

### Assigned Jobs List
The employee job list shows assigned work in a mobile-friendly layout.

Employees can review:
- ticket number;
- title;
- status;
- priority;
- scheduled start;
- due date;
- customer;
- service location;
- equipment;
- readiness status;
- next required update.

![Employee assigned jobs list](assets/system-wiki/employee-jobs.png)

Readiness helps employees understand whether a job has enough information to start. It may flag:
- inactive or completed ticket status;
- missing scheduled start;
- missing due date;
- missing customer;
- missing service location.

### Opening A Job
When an employee opens a job, the detail screen shows:
- ticket number and title;
- status and priority;
- customer, service location, and equipment labels;
- job description;
- readiness checks;
- clock-in/clock-out controls;
- work note form;
- add/request part form;
- upload photo/file form;
- work entries;
- parts requests and usage;
- uploaded files/photos.

The UI should show names and labels, not customer IDs, service-location IDs, equipment IDs, or GUIDs.

![Employee job detail and readiness review](assets/system-wiki/employee-job-detail.png)

### Job Readiness Review
The job detail page includes a "Before You Start" review.

It checks:
- ticket availability for field work;
- scheduled start;
- due date;
- customer;
- service location;
- equipment assignment;
- job instructions.

If information is missing, the employee should contact a Manager/Admin before starting or continuing work.

### Clock In
Employees clock in from the job detail screen.

Clock-in records:
- job ticket;
- employee;
- GPS latitude;
- GPS longitude;
- GPS accuracy;
- device metadata;
- optional clock note.

If GPS is unavailable or the request fails, the screen shows an error.

### Clock Out
Employees clock out from the same job detail screen.

Clock-out requires:
- an open time entry for the same job;
- a work summary;
- GPS information.

Clock-out records:
- clock-out GPS latitude;
- clock-out GPS longitude;
- GPS accuracy;
- work summary;
- optional note.

### Field Recording Guard
Employees must be clocked into the selected job before adding field records.

The guard applies to:
- work notes;
- ticket parts;
- part requests;
- photo/file uploads.

If an employee is clocked into another job, they must open that active ticket or clock out before recording work on a different ticket.

Manager/Admin back-office actions are not gated by an employee clock-in.

### Add Work Note
Employees can add work notes only after clocking into the job.

Work notes are for:
- progress updates;
- site conditions;
- performed work details;
- information the office needs to review.

### Add Or Request Part
Employees can add or request a part only after clocking into the job.

Employees can:
- search existing safe part records by part number, name, or description;
- select an existing part;
- type a new/unlisted part;
- enter quantity;
- enter notes;
- mark whether the part needs to be ordered;
- choose urgency when ordering is needed;
- enter needed-by date when ordering is needed.

If `Needs ordered` is selected:
- the item appears in the Manager/Admin parts request queue.

If `Needs ordered` is not selected:
- the item is recorded on the ticket without creating a back-office order queue item.

Technicians do not see or enter:
- unit cost;
- billable price;
- vendor cost;
- purchase history;
- catalog administration;
- inventory controls;
- invoice-facing billing fields.

### Upload Photo Or File
Employees can upload files only after clocking into the job.

Allowed file types:
- JPG;
- JPEG;
- PNG;
- WebP;
- PDF.

Employees can add an optional caption.

Unsupported file types are rejected.

Files must be 50 MB or smaller.

## Manager/Admin Workspace

### Dashboard
The dashboard summarizes operational work and provides quick entry into common queues.

Typical dashboard actions include:
- review active job tickets;
- open filtered job queues;
- check dispatch/readiness attention areas;
- move into time approval, parts requests, reports, or master-data workflows.

Dashboard links use the same Manager/Admin role boundary as the rest of the workspace.

![Manager/Admin dashboard](assets/system-wiki/manager-dashboard.png)

### Job Ticket Queue
The job-ticket queue is the main Manager/Admin work list.

Managers/Admins can filter by:
- status;
- priority;
- customer;
- dispatch readiness;
- attention condition;
- search text.

Managers/Admins can export the currently visible queue rows to CSV. The export reflects the loaded filtered view and includes readable labels for customer, service location, assigned employees, lead employees, and dispatch readiness. It does not create a server-side export job.

Queue URLs are shareable. If a Manager/Admin opens a ticket from a filtered queue, the ticket detail can preserve a safe return link back to that queue.

Important queue concepts:
- active job queue;
- waiting tickets;
- waiting on parts;
- invoice-ready queue;
- needs dispatch review;
- dispatch-ready queue;
- unassigned tickets;
- tickets needing a lead;
- unscheduled tickets;
- tickets missing a due date.

![Manager/Admin job-ticket queue](assets/system-wiki/job-ticket-queue.png)

### Create Job Ticket
Managers/Admins create tickets from `/manage/job-tickets/new`.

Job-ticket creation uses existing master data where applicable:
- customer;
- service location;
- equipment;
- billing party customer;
- assigned manager;
- status and priority;
- schedule and due date;
- job title/type/description;
- internal notes and customer-facing notes.

Validation prevents invalid or incomplete submissions where the UI has enough information to do so.

### Job Ticket Workspace
The Manager/Admin ticket detail page is organized as a field-service workbench.

It includes:
- ticket overview;
- customer context;
- service location context;
- equipment context;
- assignments;
- service scope and notes;
- status and priority review;
- time/labor visibility;
- parts used or requested;
- files/photos;
- activity;
- invoice-ready summary;
- recommended next action;
- workflow tabs.

Workflow tabs include:
- Overview;
- Dispatch;
- Time;
- Parts;
- Files;
- Closeout;
- Activity.

The workspace keeps related work on one screen instead of forcing Managers/Admins through scattered pages.

![Manager/Admin job-ticket workspace](assets/system-wiki/job-ticket-workspace.png)

### Ticket View Workflow
Managers/Admins open a ticket from the job-ticket queue, dashboard links, reports, or another Manager/Admin workflow. The ticket view preserves safe return context where possible, so a user can go back to the filtered queue they came from.

The ticket view is organized around review first and editing second:
- the top summary shows ticket number, title, status, priority, customer, location, equipment, and due date;
- the recommended next action opens the most relevant workflow screen;
- workflow tabs separate Service Details, Dispatch, Labor, Parts, Files, Invoice Review, and History;
- the side action rail keeps common Manager/Admin actions visible without taking over the whole screen.

This view is intended to answer "what needs attention?" before asking the user to edit anything.

### Dispatch Flow
Dispatch is now the parent Manager/Admin operational workflow. The dispatcher starts at `/manage/dispatch`, not inside an individual ticket, and uses the Dispatch Board to schedule jobs, assign crane/equipment, assign operator and crew, move day-of work forward, and hand completed work into ticket review and billing readiness.

Previous workflow:
- dispatch readiness was visible in the dashboard, job-ticket queue, and ticket workspace;
- scheduling, assignment, and status changes were possible, but users usually had to open a ticket detail screen to act;
- dispatch existed as a readiness concept on tickets rather than a clear first-class board.

New workflow:
- open **Dispatch** from the Manager/Admin navigation;
- choose a board view: **Unscheduled Jobs**, **Today**, **Tomorrow**, **This Week**, **Completed**, **Needs Ticket Review**, or **Ready for Billing**;
- review each job card for customer, job site, requested/scheduled timing, job type, crane/equipment, operator, crew, dispatch status, ticket status, conflicts, and missing assignments;
- use card actions for Schedule, Assign Crane, Assign Operator, Assign Crew, Dispatch, Mark En Route, Mark On Site, Start Work, Complete Work, Open Ticket, Finalize Ticket, or Ready for Billing where applicable;
- use the focused Schedule Job panel when scheduling or assignment details need to change.

Reason for change:
- dispatchers should not have to open a ticket screen for routine dispatch actions;
- the operational day is easier to run from board views than from a generic ticket list;
- schedule, crane, operator, crew, status, ticket review, and billing handoff are now visible in one workflow.

![Dispatch board](assets/system-wiki/dispatch-board.png)

![Dispatch unscheduled jobs view](assets/system-wiki/dispatch-unscheduled-jobs.png)

#### Dispatch Board
The Dispatch Board uses existing job-ticket, equipment, assignment, work-entry, and status APIs. It does not introduce a new backend dispatch-job table.

Board views:
- **Unscheduled Jobs**: open work without a scheduled start;
- **Today**: scheduled active work for the current day;
- **Tomorrow**: scheduled active work for the next day;
- **This Week**: scheduled active work in the next seven days;
- **Completed**: completed, reviewed, finalized, and invoiced ticket-backed work;
- **Needs Ticket Review**: completed work that should move into ticket review;
- **Ready for Billing**: reviewed/finalized work that can be handed to reporting/billing review.

Because dispatch is currently ticket-backed, **En Route** and **On Site** actions add ticket history notes and preserve the existing ticket status model. The board still shows those actions so dispatchers can record day-of movement without opening ticket detail.

Each card shows:
- customer;
- job site/location;
- requested date/time;
- scheduled date/time;
- job type/title;
- crane needed;
- assigned crane;
- assigned operator;
- assigned crew;
- current dispatch lifecycle label;
- ticket status/review label;
- conflict or missing-assignment warnings.

#### Job Lifecycle
The client-facing operational lifecycle is:

```mermaid
flowchart TD
  A["Job Request"] --> B["Review / Estimate"]
  B --> C["Schedule"]
  C --> D["Assign Crane"]
  D --> E["Assign Operator / Crew"]
  E --> F["Dispatch"]
  F --> G["En Route"]
  G --> H["On Site"]
  H --> I["In Progress"]
  I --> J["Work Complete"]
  J --> K["Generate / Update Ticket"]
  K --> L["Customer Approval / Signature"]
  L --> M["Finalize Ticket"]
  M --> N["Ready for Billing"]
```

Current implementation note: the board is ticket-backed. A job request is represented by a job ticket today. **Create Job Request** opens the existing ticket creation route. There is no separate unsaved dispatch-job record without a ticket yet.

#### Dispatch Statuses
The Dispatch Board presents dispatcher-friendly lifecycle labels while preserving existing backend job-ticket status enum values.

Displayed dispatch statuses include:
- Requested;
- Needs Scheduling;
- Scheduled;
- Dispatched;
- En Route;
- On Site;
- In Progress;
- Work Complete;
- Ticket In Review;
- Ticket Finalized;
- Ready for Billing;
- Invoiced.

Backend impacts: no backend enum values were changed. En Route and On Site actions currently record dispatch work-entry notes while keeping the ticket in the assigned/scheduled state until Start Work moves the ticket to In Progress.

#### Scheduling Workflow
Use **Schedule**, **Assign Crane**, **Assign Operator**, or **Assign Crew** from a dispatch card to open the focused Schedule Job panel.

The Schedule Job panel includes:
- job information;
- requested date/time;
- scheduled date/time;
- due date/time;
- crane assignment;
- operator assignment;
- crew assignment;
- notes;
- conflict warnings;
- Save Schedule;
- Cancel.

![Dispatch schedule job panel](assets/system-wiki/dispatch-schedule-job.png)

#### Crane Assignment Workflow
Crane assignment uses existing equipment records. The board labels this as crane assignment for dispatch language, while the stored relationship remains the existing job-ticket equipment field.

The board warns when the same crane/equipment appears scheduled on another active job for the selected day.

#### Operator / Crew Assignment Workflow
The operator is the lead job-ticket assignment. Crew members are non-lead job-ticket assignments.

Validation and warnings include:
- missing operator;
- missing crew/assignment;
- lead/operator not selected;
- employee already assigned to another active job on the selected day.

The UI allows a dispatcher to save with warnings so real-world exceptions can be handled intentionally. This is a warning workflow, not automatic approval or automatic scheduling.

#### Day-Of-Job Workflow
Dispatchers can move jobs forward directly from the card:
- **Dispatch** marks the job as assigned/scheduled when schedule and assignments are present;
- **Mark En Route** records a dispatch activity note;
- **Mark On Site** records a dispatch activity note;
- **Start Work** moves the ticket to In Progress;
- **Complete Work** moves the ticket to Completed.

These actions are available without opening the ticket detail screen.

#### Ticket Generation From Dispatch
The current system is ticket-backed, so the dispatch board works with existing job tickets:
- if a dispatcher needs a new job request, use **Create Job Request**;
- if a job already exists, use **Open Ticket** from the card;
- after Work Complete, use **Finalize Ticket** or open the ticket for detailed section-based review.

Future recommendation: if Crane needs dispatch records before ticket creation, add a dedicated dispatch-job model and a Generate Ticket API in a separate approved backend phase.

#### Ticket Review And Finalization
After Work Complete:
- the job appears in **Needs Ticket Review**;
- Managers/Admins can open the ticket to review the section-based ticket data, labor, parts, files/photos, closeout readiness, and activity;
- **Finalize Ticket** moves completed work into the reviewed/finalized state supported by the existing ticket status enum.

The section-based ticket editing model remains intact:
- ticket view stays organized as section cards and workflow tabs;
- top-level Edit Ticket opens section selection;
- quick actions remain available for Add Note, Add Photo, Add Labor, and Change Status.

#### Billing Readiness
Reviewed/finalized jobs appear in **Ready for Billing**. This is a handoff state for reporting and invoice-ready review.

Important boundary:
- the system does not generate invoices;
- the system does not collect payments;
- billing readiness uses existing reports and ticket closeout data.

#### Mobile Dispatch UX
On mobile:
- board tabs wrap into a compact grid;
- job cards stack vertically;
- card facts remain readable without narrow table columns;
- primary actions remain visible on the card;
- the Schedule Job panel fills the viewport with obvious Save Schedule and Cancel controls.

![Mobile dispatch board](assets/system-wiki/dispatch-board-mobile.png)

#### Permissions And Validation Rules
Dispatch Board access is Manager/Admin-only through the existing `/manage` route boundary.

Validation and warnings preserve existing data integrity:
- missing scheduled date/time blocks Schedule save;
- missing operator blocks Schedule save;
- assignment conflicts are shown as warnings;
- crane/equipment conflicts are shown as warnings;
- existing ticket update and assignment APIs remain the persistence boundary;
- no auth weakening, enum renumbering, schema migration, automatic approval, automatic compatibility, AI/scoring, or purchasing/inventory expansion was introduced.

### Ticket Editing
Managers/Admins edit ticket information through a focused in-page panel. The previous workflow opened one large edit form containing customer, service location, equipment, scope, billing, dates, status, and priority fields at the same time. That worked functionally, but it forced users to scan a long form and created extra mobile scrolling.

The new workflow keeps editing in the ticket workspace but splits the edit panel into sections:
- **Basics**: title, job type, priority, and status;
- **Customer & Equipment**: customer, service location, billing party, equipment, quick-add relationship helpers, and recent equipment service history;
- **Scope & Notes**: description, internal notes, and customer notes;
- **Billing**: purchase order and billing contact fields;
- **Schedule**: requested, scheduled start, and due dates.

The same dispatch-readiness review remains visible above the edit sections. Users can move between sections without leaving the editor, then save through the existing ticket update workflow.

![Section-based ticket editor with dispatch readiness](assets/system-wiki/ticket-section-editor.png)

Workflow tabs and action buttons now open the selected ticket workflow in a focused view. This means the selected panel appears directly under the workflow heading and tabs instead of requiring mobile users to scroll past the overview rail. The focused view includes a **Back to ticket overview** control, and that control closes any open focused panel before returning to the normal ticket overview.

The edit workflow should preserve:
- customer/service-location relationships;
- equipment relationships;
- assigned manager context;
- status and priority values;
- notes and schedule fields.

Reason for change:
- reduce long-form scrolling on desktop and mobile;
- make each editing decision easier to understand;
- keep relationship editing separate from notes, billing, and schedule changes;
- preserve the existing backend update behavior while improving the client workflow.

User experience improvements:
- fewer fields compete for attention at one time;
- section buttons make the edit model predictable;
- mobile users can edit one section at a time instead of working through a long stacked form;
- dispatch-readiness feedback remains visible while editing;
- quick actions let users add notes, upload photos/files, review labor, or change status without opening the full editor.

Technical implementation details:
- `JobTicketEditorForm` owns the section state and still emits the same ticket update payload.
- The Manager/Admin ticket detail page opens the section editor through the existing `Edit Ticket` action.
- No new route, backend service, database table, enum, migration, or authorization policy was introduced.
- Existing APIs remain in use: ticket update, work-entry add, file upload, status change, archive, assignment, part request, time-entry list, and report summary.

Component changes:
- `frontend/src/pages/manager/JobTicketEditorForm.tsx` now renders section navigation and section panels.
- `frontend/src/pages/manager/JobTicketDetailPage.tsx` exposes quick-action panels for Add Note and Add Photo/File and routes Add Labor to the Labor workflow tab.
- `frontend/src/pages/manager/JobTicketEditorForm.test.tsx` and `frontend/src/pages/manager/JobTicketDetailPage.test.tsx` cover the section navigation and quick-action behavior.

Database impacts: none.

API impacts: none. The enhancement reuses existing endpoints and DTOs.

```mermaid
flowchart TD
  A["Open ticket view"] --> B["Review summary and recommended action"]
  B --> C{"Need to edit ticket details?"}
  C -->|Yes| D["Open Edit Ticket"]
  D --> E["Choose edit section"]
  E --> F["Update section fields"]
  F --> G["Save through existing ticket update API"]
  C -->|No| H["Use workflow tabs or quick actions"]
  H --> I["Add Note / Add Photo / Add Labor / Change Status"]
```

### Mobile User Experience
On smaller screens, the section-based editor reduces the amount of visible form content. Users choose the section they need, make the change, and save. This avoids the older long-form edit mode where relationship, billing, notes, and schedule controls all appeared in one continuous vertical form.

Mobile users should prefer:
- quick actions for simple notes and photos/files;
- the Labor tab for reviewing labor/time entries;
- the Status Review panel for status changes;
- section editing only when ticket details need to change.

![Mobile ticket workspace](assets/system-wiki/ticket-workspace-mobile.png)

![Mobile ticket editor](assets/system-wiki/ticket-edit-mobile.png)

### Section-Based Editing Architecture
Section-based editing is a frontend presentation architecture. It does not split the backend ticket update command. The frontend keeps one edit draft and one save action so existing validation, API contracts, and persistence behavior remain stable.

Section responsibilities:
- Basics handles identity/status fields.
- Customer & Equipment handles relationship fields and quick-add relationship helpers.
- Scope & Notes handles narrative fields.
- Billing handles closeout billing metadata.
- Schedule handles date/time planning fields.

### User Permissions And Edit Controls
Manager/Admin users can access the ticket workbench and ticket edit controls. Employee users remain in the mobile employee workflow and do not receive Manager/Admin ticket-edit controls.

Protected controls:
- Edit Ticket;
- Add Note;
- Add Photo;
- Add Labor;
- Change Status;
- Archive Review;
- Add / Request Part;
- assignment controls.

The enhancement does not weaken authorization. It only changes the Manager/Admin frontend layout and quick-action access points.

### Quick Actions
Quick actions are short paths for common ticket updates:
- **Add Note** opens the focused History workflow with a note panel and saves a Manager/Admin work entry to ticket history.
- **Add Photo** opens the focused Files workflow with an upload panel for JPG, PNG, WebP, or PDF files and can mark the file for invoice review.
- **Add Labor** opens the focused Labor workflow tab for time/labor review and follow-up.
- **Change Status** opens a focused Status Review panel with warnings and status selection.
- **Open Add / Request Part Panel** opens the focused Parts workflow with the existing in-ticket add/request form.

Quick actions are intended for small updates. Use the section editor when relationship, billing, schedule, or detailed ticket fields need to change.

![Quick note workflow](assets/system-wiki/ticket-quick-note.png)

![Status review workflow](assets/system-wiki/ticket-status-review.png)

![Labor workflow](assets/system-wiki/ticket-labor-workflow.png)

![Parts add/request workflow](assets/system-wiki/ticket-parts-workflow.png)

Mobile focused workflows keep the selected panel directly under the workflow tabs so users do not need to hunt below the ticket overview rail.

![Mobile labor workflow](assets/system-wiki/ticket-labor-mobile.png)

![Mobile parts workflow](assets/system-wiki/ticket-parts-mobile.png)

### Ticket Workflow Audit And Repairs
The Service Ticket workflow audit completed on June 18, 2026 verified the existing business workflow without redesigning it. The audit covered workflow tabs, ticket actions, workflow cards, mobile visibility, and accessibility cues.

Findings and repairs:
- workflow tabs already changed active content, but action shortcuts could leave the target panel below the normal overview rail on mobile;
- quick-action drawers did not have a reliable focus target, which made the opened panel less obvious for keyboard and assistive-technology users;
- the focused workflow panel could take focus back from an opened drawer;
- **Back to ticket overview** returned from focused mode but did not close an open focused drawer;
- active tab and drawer focus contrast needed stronger shared styling.

Implemented repairs:
- direct workflow tab and action-rail navigation now sets the URL-backed `view=workflow` state;
- Add Note, Add Photo, Add Labor, Add / Request Part, Edit Ticket, Change Status, and Archive Review open focused panels where appropriate;
- drawer panels receive programmatic focus when opened;
- workflow panel focus waits when a drawer is active;
- **Back to ticket overview** clears open focused drawers;
- global error messages announce as alerts;
- active workflow tabs and focused drawers use stronger shared contrast/focus styling.

See [Service Ticket Workflow Audit - June 18, 2026](/docs/service-ticket-workflow-audit-2026-06-18.md) for the detailed audit report, root cause notes, regression results, and remaining recommendations.

### Assignment Management
Managers/Admins can assign active, non-archived Employee users to tickets.

Assignments may include lead assignment behavior where supported by the UI.

The employee assignment dropdown uses a Manager/Admin-safe employee lookup and does not expose full Admin-only user-management data.

### Status Review
Managers/Admins can review and update ticket status.

Status changes should remain intentional because they affect queue placement, readiness, reporting, and closeout behavior.

### Archive Review
Archiving is soft-delete behavior. Records are preserved but removed from ordinary active workflows.

Managers/Admins use archive review controls rather than hard deletion.

## Time Tracking And Approval

### Employee Time Capture
Employees create time entries by clocking in and clocking out of assigned jobs.

Time entries connect field activity to:
- employee;
- job ticket;
- GPS points;
- work summary;
- labor review.

### Manager/Admin Time Approval Queue
The Time Approval screen is queue-first.

It loads pending entries by default.

Managers/Admins can filter by:
- date range;
- employee name;
- approval status;
- broad job/customer/site/location search.

Managers/Admins can:
- review entry context;
- approve eligible completed pending entries;
- reject entries with a reason;
- edit and approve with an audit reason;
- bulk approve eligible completed pending entries.

Manager edits reuse audit-safe adjustment behavior.

The system does not add unsupported payroll, break-duration, or labor-type schema concepts in this workflow.

![Manager/Admin time approval queue](assets/system-wiki/time-approval.png)

## Parts And Part Requests

### Technician Part Capture
From an assigned job, technicians can:
- choose an existing safe part lookup result;
- type an unlisted part;
- record quantity and notes;
- mark whether the part needs ordered.

This keeps the technician workflow simple and field-focused.

### Manager/Admin Parts Request Queue
Needs ordered items appear in the Manager/Admin parts request queue.

Managers/Admins can:
- filter and search requests;
- open request details;
- update request status;
- add internal notes;
- match the request to an existing catalog part;
- record part cost snapshot;
- record billable price snapshot;
- mark billable state.

This is a ticket-support workflow. It is not automatic purchasing, automatic approval, or automatic compatibility.

![Manager/Admin parts request queue](assets/system-wiki/part-requests.png)

### Parts Usage History
Parts usage history gives Managers/Admins visibility into historical usage.

The wording is intentionally cautious. It should not be treated as:
- recommendations;
- scoring;
- compatibility automation;
- AI guidance.

## Master Data

Master data supports job-ticket operations. It should be kept clean because tickets, reports, and field workflows rely on these records.

### Customers
Customer records represent the customer or account tied to work.

Managers/Admins can:
- create customers;
- edit customer information;
- archive/unarchive customers;
- filter and review customer records.

Customer data can include:
- name;
- account/contact details;
- billing-related contact fields where supported.

### Service Locations
Service locations represent where work is performed.

Managers/Admins can:
- create service locations;
- associate locations with customers;
- edit address/location details;
- archive/unarchive locations;
- filter and review locations.

Service locations should remain aligned to the correct customer.

### Equipment
Equipment records represent assets serviced by the company.

Managers/Admins can:
- create equipment;
- associate equipment with a customer and service location;
- edit model/serial/type/ownership details where supported;
- archive/unarchive equipment;
- filter and review equipment.

Equipment create/edit workflows guard against mismatched customer and service-location relationships where the UI has enough data to validate.

### Vendors
Vendor records support existing purchasing and part workflows.

Managers/Admins can:
- create vendors;
- edit vendor contact/account details;
- archive/unarchive vendors;
- filter and review vendors.

### Part Categories
Part categories organize catalog parts.

Managers/Admins can:
- create categories;
- edit descriptions;
- archive/unarchive categories;
- filter and review categories.

### Parts
Part records represent catalog parts used in job tickets, part requests, reports, and purchasing support.

Managers/Admins can:
- create parts;
- edit part number, name, description, category, vendor, cost, billable price, quantity-on-hand, and reorder threshold where supported;
- archive/unarchive parts;
- filter by category/vendor;
- review parts.

Negative numeric values are blocked in the UI for part cost, billable price, quantity on hand, and reorder threshold.

Archived relationship records are kept out of blank create-form selectors where appropriate, while existing archived relationships can still be preserved during edit mode.

![Manager/Admin master-data customer screen](assets/system-wiki/master-data-customers.png)

## Purchasing Support

The purchasing screen documents and supports the purchasing baseline already present in the system.

Managers/Admins can work with:
- purchase orders;
- vendors;
- expected dates;
- purchase-order lines;
- submitted, received, canceled, closed, archived, and unarchived states;
- vendor invoice metadata where already supported;
- landed-cost fields where already supported;
- receipt recording for purchase-order quantities.

This is existing purchasing support. It is not approval to expand into a larger purchasing, accounting, receiving, or vendor-invoice product without a separate approved scope.

The purchasing screen shows success and error feedback for create, submit, receiving, close, archive, and vendor-invoice save actions. Inventory remains hidden until that workflow is completed, so users should treat purchasing as purchase-order coordination rather than a complete warehouse workflow.

![Manager/Admin purchasing support screen](assets/system-wiki/purchasing.png)

## Reports

Reports are Manager/Admin-only.

The reports hub is organized into:
- invoice/closeout reports;
- labor/parts reports;
- service-history reports.

Implemented report types include:
- invoice-ready summary for a selected job ticket;
- job cost summary for a selected job ticket;
- jobs ready to invoice;
- labor by job;
- labor by employee;
- parts by job;
- customer service history;
- equipment service history.

Reports support shared filters where applicable:
- from date;
- to date;
- customer;
- billing party customer;
- service location;
- employee;
- job status;
- invoice status;
- offset;
- limit.

The frontend validates required source selections, date ranges, and paging values before calling report APIs.

Report inputs are saved per report on the user's browser. For example, changing the selected job ticket on Invoice-ready Summary does not change the selected job ticket on Job Cost Summary. Use **Reset report inputs** to clear saved report defaults and return filters to their standard values.

### Report Output
Generated reports continue to open in a separate results screen within the reports workflow.

From generated report results, users can:
- review report metadata, including visible row count, visible column count, generated time, and applied scope;
- review rows in an export-friendly table;
- run the same report again with the current source and filters;
- export currently loaded rows to a date-stamped CSV file;
- use browser print/save-PDF output where rows are available.

Important reporting boundaries:
- PDF output uses the browser print dialog.
- CSV export is generated in the browser from currently loaded rows and includes report metadata at the top of the file.
- Empty reports do not expose CSV or print/save-PDF actions.
- The system does not generate invoices.
- The system does not collect payments.
- The system does not provide a customer portal.
- The system does not run server-side reporting jobs.

![Manager/Admin reports hub](assets/system-wiki/reports-hub.png)

## Admin User Management

Admin-only user management is available at `/manage/users`.

Admins can:
- search accounts;
- filter by role;
- filter by active/inactive status;
- create users;
- edit users;
- deactivate/archive users;
- reset passwords.

Managers cannot access this screen.

User-management workflows should preserve:
- role boundaries;
- active/inactive state handling;
- no hard deletes;
- no auth weakening.

![Admin user-management screen](assets/system-wiki/admin-users.png)

## Data Display Rules

The UI should display business labels instead of internal IDs.

Examples:
- customer name instead of customer ID;
- service location name instead of service-location ID;
- equipment name/number instead of equipment ID;
- employee name instead of employee ID where the screen supports it.

IDs remain important for API operations, but the client-facing UI should avoid exposing GUID-like values when human-readable data is available.

## Archive And Unarchive Behavior

Archive means the record is removed from normal active workflows but retained for history.

Archive/unarchive applies to many operational records, including:
- customers;
- service locations;
- equipment;
- parts;
- vendors;
- part categories;
- stock locations;
- purchase orders where supported;
- users through Admin management.

The project uses soft-delete/archive behavior rather than hard deletion.

## Validation And Error Behavior

The UI should guide users before bad data is submitted.

Common validation examples:
- required names cannot be blank or whitespace-only;
- part numeric values cannot be negative;
- equipment year must be a whole year between 1900 and 2100 where the field is used;
- equipment customer and service location must align;
- required report source IDs must be selected before generating source-specific reports;
- invalid report date ranges and paging values are blocked;
- employees must be clocked into the selected job before recording field work.

When a request fails, the screen should show a useful error message and keep the user in the workflow.

## Recommended Operating Process

### Daily Manager/Admin Flow
1. Open the dashboard.
2. Review urgent queue summaries.
3. Open the Dispatch Board for unscheduled, today, tomorrow, this-week, completed, ticket-review, and billing-ready work.
4. Schedule jobs and assign crane, operator, and crew from dispatch cards.
5. Move day-of jobs through Dispatch, En Route, On Site, In Progress, and Work Complete.
6. Open tickets needing detailed section-based review.
7. Review tickets waiting on parts.
8. Review pending time entries.
9. Review reports for closeout and invoice-ready work.

### Technician Field Flow
1. Sign in.
2. Open assigned jobs.
3. Review the first assigned job and readiness checks.
4. Open the job.
5. Clock in with GPS.
6. Record work notes as work is performed.
7. Add/request parts as needed.
8. Upload photos or PDFs as supporting evidence.
9. Clock out with a required work summary.

### Back-Office Parts Flow
1. Open the parts request queue.
2. Filter/search requests.
3. Review the ticket and technician notes.
4. Match to a catalog part if appropriate.
5. Update request status.
6. Add internal status notes.
7. Record cost/billable snapshot if needed.
8. Coordinate any purchasing support manually through the existing purchasing workflow if applicable.

### Closeout Flow
1. Open job tickets that are completed or ready for closeout.
2. Review time entries and approval state.
3. Review parts and part approval state.
4. Review files/photos and work activity.
5. Use invoice-ready and cost-summary reporting.
6. Export or print/save-PDF report results where needed.

## Current Scope Boundaries

The system currently does not include:
- external customer portal;
- client hub workflow;
- online payments;
- payment collection;
- quote approval automation;
- customer notification automation;
- new purchasing expansion beyond the existing baseline;
- receiving expansion beyond the existing baseline;
- vendor invoice tracking expansion;
- landed-cost expansion beyond existing supported fields;
- inventory workflow;
- warehouse inventory expansion;
- truck inventory expansion;
- low-stock alerts;
- replenishment automation;
- parts recommendations;
- AI/scoring;
- automatic compatibility decisions;
- automatic approval;
- hard deletes;
- backend enum renumbering.

Any of those areas should be treated as future scope requiring a separate approval and implementation plan.

## Client Training Checklist

Use this checklist when introducing the system to a client team.

### Employee Training
- Sign in and reach assigned jobs.
- Understand job readiness warnings.
- Open a job.
- Clock in with GPS.
- Add a work note.
- Add an existing part.
- Type an unlisted part.
- Mark a part as Needs ordered.
- Upload a photo/file.
- Clock out with a work summary.
- Understand why fields are disabled before clock-in.

### Manager Training
- Use the dashboard.
- Use the Dispatch Board.
- Schedule jobs without opening ticket detail.
- Assign crane, operator, and crew.
- Move day-of jobs through dispatch status actions.
- Filter job-ticket queues.
- Create a job ticket.
- Open the ticket workspace.
- Assign employees.
- Update ticket status/priority.
- Review dispatch readiness.
- Review time entries.
- Approve/reject/edit-and-approve time.
- Review part requests.
- Use reports and exports.
- Manage master data.

### Admin Training
- Create users.
- Edit users.
- Deactivate users.
- Reset passwords.
- Filter accounts.
- Explain Manager vs Admin access.

### Back-Office Training
- Maintain clean customer/location/equipment data.
- Maintain part, vendor, and category data.
- Review Needs ordered part requests.
- Use purchasing support carefully within current scope.
- Produce closeout reports.

## Demo Users

Local demo environments may include these users:
- `pilot.admin` / `PilotDemo123!`
- `pilot.manager` / `PilotDemo123!`
- `pilot.tech` / `PilotDemo123!`
- bootstrap-only admin: `test.admin` / `TestAdmin123!`

Demo users are for local/pilot environments only and should not be treated as production credentials.

## Support Notes

When reporting an issue, include:
- user role;
- route/screen;
- job ticket number if applicable;
- customer/location/equipment involved;
- exact action attempted;
- visible error message;
- whether the user was clocked into the job;
- browser and device type;
- screenshot if available.

For operational questions, start with:
- Is the user in the correct role?
- Is the ticket assigned to the employee?
- Is the employee clocked into the selected job?
- Is the record archived?
- Is the required master data missing?
- Is the report missing a required source filter?
- Is the workflow trying to use a deferred feature that is intentionally out of scope?
