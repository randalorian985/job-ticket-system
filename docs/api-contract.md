# API Contract (Initial)

## Base URL
`/api`

## Health
- `GET /health`
  - **Response 200**
    ```json
    {
      "status": "Healthy"
    }
    ```

## Future API Groups
- `/api/tickets`
- `/api/users`
- `/api/assignments`

## Master Data (Current)
All list endpoints support simple pagination with optional query params:
- `offset` (default `0`)
- `limit` (default `50`, max `200`)

### Customers
- `GET /api/customers`
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `POST /api/customers/{id}/archive`

### Service Locations
- `GET /api/service-locations`
- `GET /api/service-locations/{id}`
- `POST /api/service-locations`
- `PUT /api/service-locations/{id}`
- `POST /api/service-locations/{id}/archive`

### Equipment
- `GET /api/equipment`
- `GET /api/equipment/{id}`
- `POST /api/equipment`
- `PUT /api/equipment/{id}`
- `POST /api/equipment/{id}/archive`

### Vendors
- `GET /api/vendors`
- `GET /api/vendors/{id}`
- `POST /api/vendors`
- `PUT /api/vendors/{id}`
- `POST /api/vendors/{id}/archive`

### Part Categories
- `GET /api/part-categories`
- `GET /api/part-categories/{id}`
- `POST /api/part-categories`
- `PUT /api/part-categories/{id}`
- `POST /api/part-categories/{id}/archive`

### Parts
- `GET /api/parts`
- `GET /api/parts/{id}`
- `POST /api/parts`
- `PUT /api/parts/{id}`
- `POST /api/parts/{id}/archive`

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
- Work entries are note/description records only in this phase (no time tracking or file uploads).
- Job ticket files are stored outside SQL Server through a storage provider abstraction (`IFileStorageProvider`).
- Current provider writes to a configurable local root (`FileStorage:RootPath`) and stores only metadata in `JobTicketFiles`.
- Supported upload types: `jpg`, `jpeg`, `png`, `webp`, and `pdf` (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- File rows support optional `EquipmentId`, `WorkEntryId`, and `UploadedByEmployeeId` validation when provided.
- File archive endpoint is soft-delete only (`IsDeleted = true`) and archived files are excluded from normal list/get calls.
- File upload, metadata update, and archive actions are audit logged.
- Job part usage stores immutable `UnitCostSnapshot` and `SalePriceSnapshot` from the Part master record at add time.
- Job part quantity must be greater than zero; job ticket and part references must be active.
- `AddedByEmployeeId` is optional but, when provided, must reference an active employee assigned to the ticket unless manager override is enabled.
- Approved or invoiced part usage rows are locked from edits unless manager override is enabled.
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
- Labor billable totals use `Employee.BillRate`, with fallback to `Employee.LaborRate` when bill rate is not present.
- Labor cost totals use `Employee.CostRate` when available.
- Parts totals always use `JobTicketPart.UnitCostSnapshot` and `JobTicketPart.SalePriceSnapshot`.
- Grand total is computed as labor billable total + parts billable total + misc placeholder + tax placeholder.
- Jobs-ready-to-invoice requires completed/reviewed jobs with approved labor and/or approved parts, and excludes invoiced/closed invoice states.

## Versioning
Planned: URL-based versioning (`/api/v1/...`) once endpoints stabilize.
