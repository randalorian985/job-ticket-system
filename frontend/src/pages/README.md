# Pages

Route-level page components belong in this folder.

## Manager/Admin Ticket Editing

`manager/JobTicketDetailPage.tsx` owns the Manager/Admin ticket workbench. Ticket view is review-first: service details, one next action, practical tabs, technician context, labor, parts, files, history, and invoice review remain visible as coordinated panels. Scheduling is a handoff from the ticket screen; keep scheduling links clear without rebuilding the Scheduling module inside the ticket detail page. The primary ticket review column should come before the support action rail; the rail sits on the right on desktop and below the ticket review flow on mobile.

`manager/JobTicketEditorForm.tsx` owns section-based ticket editing. It keeps one ticket edit draft and submits the existing update payload, but renders the draft through these frontend sections:

- `Basics`: title, job type, priority, and status.
- `Customer & Equipment`: customer, service location, billing party, equipment, quick-add relationship helpers, and recent equipment service history.
- `Scope & Notes`: description, internal notes, and customer-facing notes.
- `Billing`: purchase order and billing contact fields.
- `Schedule`: requested, scheduled start, and due dates.

Usage pattern:

```tsx
<JobTicketEditorForm
  initial={editPayload}
  customers={customers}
  serviceLocations={locations}
  equipment={equipment}
  submitLabel="Save Ticket"
  onSubmit={(payload) => jobTicketsApi.update(jobTicketId, payload)}
/>
```

The section model is presentation-only. Do not split the backend update API unless a future approved API contract explicitly calls for partial ticket updates.

Quick actions in `JobTicketDetailPage.tsx` should remain focused:

- Add Note saves a job work entry through `jobTicketsApi.addWorkEntry`.
- Add File uploads photos, PDFs, or closeout attachments through `filesApi.upload`.
- Review Labor opens the existing Labor workflow tab.
- Change Status opens the existing status review drawer.
- Open Scheduling links to the Scheduling module.

Workflow tab and quick-action navigation is URL-backed. Direct tab/action selection should set the selected `tab` and the focused `view=workflow` state so the target panel appears immediately under the workflow tabs on mobile. Open drawers must have a stable focus target, and **Back to ticket overview** should close any open focused drawer before returning to the normal overview.

Do not add Manager/Admin-only quick actions that bypass existing authorization, DTO validation, or workflow review panels.
