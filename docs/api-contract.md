# API Contract (Current)

## Base URL
`/api`

## Health
- `GET /health`
  - **Response 200**
    ```json
    {
      "status": "Healthy",
      "totalDuration": "00:00:00.0000000",
      "entries": {
        "example-check": {
          "status": "Healthy",
          "duration": "00:00:00.0000000",
          "description": "Optional check description"
        }
      }
    }
    ```

## System Metadata
- `GET /api/system/info`
  - Public endpoint for lightweight deployment diagnostics and frontend compatibility checks.
  - **Response 200**
    ```json
    {
      "serviceName": "Job Ticket Management System API",
      "apiBasePath": "/api",
      "healthEndpoint": "/health",
      "environmentName": "Development",
      "version": "1.0.0.0"
    }
    ```

## API Group Status

### Implemented and Active
- Health (`/health`)
- System metadata (`/api/system/info`)
- Authentication (`/api/auth/*`)
- User management (`/api/users/*`)
- Master data (`/api/customers`, `/api/service-locations`, `/api/equipment`, `/api/vendors`, `/api/part-categories`, `/api/parts`)
- Job tickets (`/api/job-tickets/*`)
- Time entries (`/api/time-entries/*`)
- Reporting (`/api/reports/*`)

### Implemented Backend + Frontend (Manager/Admin UI Phases 1-2)
- Manager/Admin React routes consume management/reporting endpoints for read-first pages plus targeted edit workflows.
- Job ticket management now includes create (`/manage/job-tickets/new`), detail edit, assignment add/remove, status update confirmation, and archive reason capture.
- Reports UI consumes existing report query filters (`dateFromUtc`, `dateToUtc`, `customerId`, `employeeId`, `jobStatus`, etc.) and supports client-side CSV export from loaded rows.
- Master-data screens now include targeted create/edit/archive actions for supported APIs.
- Admin-only frontend route for `/api/users` remains isolated and now includes create/edit/archive/reset-password actions.

### Deferred Future Features (Not Implemented)
- Parts purchase/vendor cost tracking workflows.
- Advanced inventory management workflows.
- Parts compatibility recommendation engine.
- AI/scoring-based part recommendations.

## Master Data (Current)
All list endpoints support simple pagination with optional query params:
- `offset` (default `0`)
- `limit` (default `50`, max `200`)
- `includeArchived` (default `false`; when `true`, Manager/Admin responses include soft-archived rows with `isArchived: true` so unarchive workflows can present and restore them)

### Customers
- `GET /api/customers`
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `POST /api/customers/{id}/archive`
- `POST /api/customers/{id}/unarchive`

### Service Locations
- `GET /api/service-locations`
- `GET /api/service-locations/{id}`
- `POST /api/service-locations`
- `PUT /api/service-locations/{id}`
- `POST /api/service-locations/{id}/archive`
- `POST /api/service-locations/{id}/unarchive`

### Equipment
- `GET /api/equipment`
- `GET /api/equipment/{id}`
- `POST /api/equipment`
- `PUT /api/equipment/{id}`
- `POST /api/equipment/{id}/archive`
- `POST /api/equipment/{id}/unarchive`

### Vendors
- `GET /api/vendors`
- `GET /api/vendors/{id}`
- `POST /api/vendors`
- `PUT /api/vendors/{id}`
- `POST /api/vendors/{id}/archive`
- `POST /api/vendors/{id}/unarchive`

### Part Categories
- `GET /api/part-categories`
- `GET /api/part-categories/{id}`
- `POST /api/part-categories`
- `PUT /api/part-categories/{id}`
- `POST /api/part-categories/{id}/archive`
- `POST /api/part-categories/{id}/unarchive`

### Parts
- `GET /api/parts`
- `GET /api/parts/lookup` (employee-safe lookup for part selection; returns `id`, `partNumber`, `name`, `description`)
- `GET /api/parts/{id}`
- `POST /api/parts`
- `PUT /api/parts/{id}`
- `POST /api/parts/{id}/archive`
- `POST /api/parts/{id}/unarchive`

List/detail/create/update responses use DTOs and expose `isArchived` for master-data rows; EF entities remain internal. Unarchive endpoints can return validation errors (`400`) when required linked records are archived/deleted/inactive, and `404` when the target record does not exist.

## Job Tickets (Current)
### Endpoints
- `GET /api/job-tickets`
- `GET /api/job-tickets/{id}`
- `POST /api/job-tickets`
- `PUT /api/job-tickets/{id}`
- `POST /api/job-tickets/{id}/status`
- `POST /api/job-tickets/{id}/archive`
- `GET /api/job-tickets/{id}/assignments`
- `POST /api/job-tickets/{id}/assignments`
- `DELETE /api/job-tickets/{id}/assignments/{employeeId}`
- `GET /api/job-tickets/{id}/work-entries`
- `POST /api/job-tickets/{id}/work-entries`
- `GET /api/job-tickets/{jobTicketId}/parts`
- `POST /api/job-tickets/{jobTicketId}/parts`
- `PUT /api/job-tickets/{jobTicketId}/parts/{jobTicketPartId}`
- `POST /api/job-tickets/{jobTicketId}/parts/{jobTicketPartId}/approve`
- `POST /api/job-tickets/{jobTicketId}/parts/{jobTicketPartId}/reject`
- `POST /api/job-tickets/{jobTicketId}/parts/{jobTicketPartId}/archive`
- `GET /api/job-tickets/{jobTicketId}/files`
- `GET /api/job-tickets/{jobTicketId}/files/{fileId}`
- `POST /api/job-tickets/{jobTicketId}/files` (multipart/form-data with `file`)
- `GET /api/job-tickets/{jobTicketId}/files/{fileId}/download`
- `PUT /api/job-tickets/{jobTicketId}/files/{fileId}`
- `POST /api/job-tickets/{jobTicketId}/files/{fileId}/archive`

### Behavior Notes
- Job tickets are soft archived (`IsDeleted = true`) and excluded by default query filters.
- `TicketNumber` is auto-generated as `JT-YYYY-000001` and incremented per year.
- Status transition to `Completed` sets `CompletedAtUtc`; leaving `Completed` clears it.
- Archive requests must provide `ArchiveReason`.
- Assignment API enforces one active assignment per employee per ticket.
- Work entries are note/description records only in this phase (no time tracking or file uploads). `EntryType` must be a defined `WorkEntryType` value (`1=Note`, `2=Diagnosis`, `3=Repair`, `4=Inspection`, `5=Recommendation`); invalid enum values are rejected with `400 Bad Request`.
- Job ticket files are stored outside SQL Server through a storage provider abstraction (`IFileStorageProvider`).
- Current provider writes to a configurable local root (`FileStorage:RootPath`) and stores only metadata in `JobTicketFiles`; file DTO responses do not expose provider storage keys or local paths.
- Supported upload types: `jpg`, `jpeg`, `png`, `webp`, and `pdf` (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- File rows support optional `EquipmentId`, `WorkEntryId`, and `UploadedByEmployeeId` validation when provided.
- File archive endpoint is soft-delete only (`IsDeleted = true`) and archived files are excluded from normal list/get calls.
- File upload, metadata update, and archive actions are audit logged.
- Job part usage stores immutable `UnitCostSnapshot` and `SalePriceSnapshot` from the Part master record at add time. Manager/Admin job-part responses include these snapshots; assigned-employee job-part response paths omit them.
- Job part quantity must be greater than zero; job ticket and part references must be active.
- `AddedByEmployeeId` is optional but, when provided, must reference an active employee assigned to the ticket unless manager override is enabled.
- Approved or invoiced part usage rows are locked from edits unless manager override is enabled.
- Part approval state transitions are manager/admin-only (`approve`/`reject` endpoints). Employee updates cannot set approval status. Numeric job-part approval values are `1=Pending`, `2=Approved`, `3=Rejected`, `4=Invoiced`.
- Rejection requires a non-empty reason.
- Archiving is soft-delete only (`IsDeleted = true`) and excluded from normal lists via query filters.
- Inventory decrement/restore is supported through add/archive DTO flags (`AdjustInventory`, `RestoreInventory`).
- Part add/update/archive/approve/reject actions are audit logged.

## Time Entries (Current)
### Endpoints
- `POST /api/time-entries/clock-in`
- `POST /api/time-entries/clock-out`
- `GET /api/time-entries/open?employeeId={employeeId}`
- `GET /api/time-entries/job/{jobTicketId}`
- `GET /api/time-entries/employee/{employeeId}`
- `POST /api/time-entries/{id}/approve`
- `POST /api/time-entries/{id}/reject`
- `POST /api/time-entries/{id}/adjust`

### Behavior Notes
- Clock-in requires `JobTicketId`, `EmployeeId`, GPS latitude/longitude, and device metadata.
- Clock-in captures immutable labor-rate snapshots on the time entry (`CostRateSnapshot`, `BillRateSnapshot`) from the employee record at clock-in time.
- Clock-out requires `TimeEntryId`, `EmployeeId`, GPS latitude/longitude, and `WorkSummary`.
- Employee must be actively assigned to the target job ticket before clock-in.
- Employees can only have one open time entry at once and can only clock out their own open entry.
- Clock-out stores GPS coordinates and calculates `TotalMinutes`, `LaborHours`, and `BillableHours`.
- Clock-out creates a job work entry note using `WorkSummary`.
- Approve/reject endpoints support manager workflow (`ApprovedByUserId`, rejection reason).
- Adjustment requires a reason and writes `TimeEntryAdjustment` rows with original and new values for auditability.
- Approved or invoiced entries require explicit manager override before adjustment.
- Clock-in, clock-out, approval, rejection, and adjustment actions write audit logs.


## Reporting (Current)
### Endpoints
- `GET /api/reports/job-tickets/{jobTicketId}/invoice-ready`
- `GET /api/reports/job-tickets/{jobTicketId}/cost-summary`
- `GET /api/reports/jobs-ready-to-invoice`
- `GET /api/reports/labor/by-job`
- `GET /api/reports/labor/by-employee`
- `GET /api/reports/parts/by-job`
- `GET /api/reports/customers/{customerId}/service-history`
- `GET /api/reports/equipment/{equipmentId}/service-history`

### Shared Query Filters
The collection-style report endpoints (`jobs-ready-to-invoice`, `labor/by-job`, `labor/by-employee`, `parts/by-job`, customer service history, and equipment service history) support the following query parameters where exposed by their controller actions. Single-job summaries (`invoice-ready`, `cost-summary`) are selected by `jobTicketId` path only.

- `dateFromUtc`
- `dateToUtc`
- `customerId`
- `billingPartyCustomerId`
- `serviceLocationId`
- `employeeId`
- `jobStatus`
- `invoiceStatus`
- `offset`
- `limit`

### Calculation Rules
- Invoice-ready and cost reports include only approved labor (`ApprovalStatus = Approved`) from closed time entries (`EndedAtUtc != null`).
- Invoice-ready and cost reports include only approved job parts (`ApprovalStatus = Approved`).
- Archived/deleted records are excluded by global query filters (`IsDeleted = true`).
- Labor billable totals use immutable `TimeEntry.BillRateSnapshot` when present; legacy rows fall back to `Employee.BillRate`, then `Employee.LaborRate`.
- Labor cost totals use immutable `TimeEntry.CostRateSnapshot` when present; legacy rows fall back to `Employee.CostRate`.
- Parts totals always use `JobTicketPart.UnitCostSnapshot` and `JobTicketPart.SalePriceSnapshot`.
- Grand total is computed as labor billable total + parts billable total + misc placeholder + tax placeholder.
- Jobs-ready-to-invoice requires completed/reviewed jobs with approved labor and/or approved parts, and excludes invoiced/closed invoice states.


### Manager/Admin Reports UI Contract Notes (Phase 3C)
- Existing reporting endpoints and auth policies are unchanged; Phase 3C is a UI/operator polish slice only.
- Manager/Admin reports UI presents a report hub for invoice-ready summary, job cost summary, jobs ready to invoice, labor by job, labor by employee, parts by job, customer service history, and equipment service history.
- Manager/Admin reports UI exposes only supported filters: shared date/customer/billing-party/service-location/employee/job-status/invoice-status/offset/limit filters for collection reports, `jobTicketId` for invoice-ready/job-cost summaries, `customerId` for customer service history, and `equipmentId` for equipment service history. Human-readable picker/search filters remain a follow-up unless added to existing APIs later.
- Reports CSV export is client-side and generated from already loaded visible data only (no new export API endpoint). CSV headers are friendly labels and values are quoted/escaped by the frontend utility.
- Labor reporting UI text explicitly labels snapshot-first behavior with fallback for legacy null snapshot values.

## Versioning
Planned: URL-based versioning (`/api/v1/...`) once endpoints stabilize.


## Authentication

- `POST /api/auth/login` accepts `AuthLoginRequestDto` (`usernameOrEmail`, `password`) and returns JWT token + current user payload.
- `GET /api/auth/me` returns authenticated user profile for bearer token.
- Protected endpoints require bearer token.

## Authorization Policies

- `AdminOnly`: system-level management endpoints (`/api/users/*`).
- `ManagerOrAdmin`: reporting, archive/delete, assignment, approval/rejection flows.
- `EmployeeOrAbove`: general authenticated access.
- `AssignedEmployeeOrManager`: job-ticket file/work/parts actions requiring assignment for employees.

### Employee Mobile Workflow API Notes

- Employee mobile clients should use `POST /api/auth/login` and `GET /api/auth/me` for token/session state.
- Employee job access is assignment-scoped. `GET /api/job-tickets` is automatically filtered to assigned jobs for non-manager users.
- Employee work actions for assigned jobs:
  - `GET/POST /api/job-tickets/{id}/work-entries`
  - `GET/POST /api/job-tickets/{jobTicketId}/parts`
  - `GET /api/parts/lookup` for part selection
  - `POST /api/time-entries/clock-in`
  - `POST /api/time-entries/clock-out`
  - `GET /api/time-entries/open?employeeId={employeeId}`
  - `GET/POST /api/job-tickets/{jobTicketId}/files`

## User Management

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `POST /api/users/{id}/archive`
- `POST /api/users/{id}/reset-password`


## Frontend Route Notes (Current)
- Employee routes: `/login`, `/jobs`, `/jobs/:jobTicketId`.
- Manager/Admin routes: `/manage`, `/manage/job-tickets`, `/manage/job-tickets/new`, `/manage/job-tickets/:jobTicketId`, `/manage/customers`, `/manage/service-locations`, `/manage/equipment`, `/manage/parts`, `/manage/time-approval`, `/manage/parts-approval`, `/manage/reports`.
- Admin-only route: `/manage/users` (consumes `/api/users`).
- Unauthorized route: `/unauthorized` for authenticated users lacking required role claims.

## Phase 3B Master Data
- Manager/Admin endpoints for customers, service locations, equipment, vendors, part categories, and parts are used for list/detail/create/update/archive/unarchive workflows via DTO contracts. Collection endpoints accept `includeArchived=true` to support UI unarchive flows without exposing EF entities.
