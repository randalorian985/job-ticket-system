# API Contract (Current Main State Plus Parts Request Workflow Phase 2)

## Base URL
`/api`

## Public Endpoints
- `GET /health` is public and unauthenticated.
- `GET /api/system/info` is public and unauthenticated.

## Implemented API Groups
- Authentication (`/api/auth/*`)
- User management (`/api/users/*`)
- Assignable employee lookup (`/api/users/assignable-employees`)
- Master data (`/api/customers`, `/api/service-locations`, `/api/equipment`, `/api/vendors`, `/api/part-categories`, `/api/parts`)
- Technician-safe part lookup (`/api/parts/lookup`)
- Job tickets (`/api/job-tickets/*`)
- Job-ticket files/photos (`/api/job-ticket-files/*`)
- Time entries (`/api/time-entries/*`)
- Reporting (`/api/reports/*`)
- Parts usage history visibility (`/api/parts/usage-history`)
- Parts request workflow Phase 2 (`/api/part-requests/*`)
- Purchase orders and vendor cost tracking (`/api/purchase-orders/*`)
- Inventory foundation (`/api/inventory/*`)

## Manager/Admin Master Data
Manager/Admin master-data UI polish uses the existing master-data endpoints listed above. Expanded create/edit forms send the already-documented DTO fields for customer contact/account details, service-location status/address/customer association, equipment ownership/billing/model/serial/type details, vendor contact/account details, part category descriptions, and part description/stock/reorder values.

This UI polish does not add endpoints, change DTO shapes, change authorization, add schema or migrations, alter enum values, or expand purchasing, receiving, landed-cost, inventory, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

## Manager/Admin Time Approval Review
- `GET /api/time-entries/review`
- Authorization: `ManagerOrAdmin`
- Response DTO: `TimeApprovalQueueItemDto[]`
- Optional query filters:
  - `jobTicketId`
  - `employeeId`
  - `approvalStatus` (`1` Pending, `2` Approved, `3` Rejected)
  - `dateFromUtc`
  - `dateToUtc`
  - `search` (ticket ID/number, job fields, customer, site, and location)
- The Manager/Admin screen requests `approvalStatus=1` on initial load, so its pending work queue appears without requiring filter input. Omitting `approvalStatus` from the endpoint returns all statuses.
- Results include manager-facing employee/job/customer/location labels and are ordered by newest `startedAtUtc` first. Approval and rejection continue to use Manager/Admin-only action endpoints.
- Existing enum numeric values are unchanged.

## Assignable Employee Lookup
- `GET /api/users/assignable-employees`
- Authorization: `ManagerOrAdmin`
- Response DTO: `AssignableEmployeeDto`
  - `id`
  - `firstName`
  - `lastName`
- Behavior:
  - returns only active, non-archived users with role `Employee`;
  - intended for Manager/Admin job-ticket assignment controls;
  - does not return username, email, role-management data, password hash, user status, archive metadata, or reset-password/user-management fields.

## Technician-Safe Part Lookup
- `GET /api/parts/lookup?offset=0&limit=50`
- Authorization: `EmployeeOrAbove`
- Response DTO: `PartLookupDto`
  - `id`
  - `partNumber`
  - `name`
  - `description`
- This endpoint is safe for technician in-ticket search. It does not return part cost, billable price, vendor cost, purchase history, inventory quantity, reorder thresholds, billing controls, or catalog-admin fields.

## Employee Field Recording Guard
Employee field-recording APIs require the assigned employee to be clocked into the selected job ticket before recording new field work. Manager/Admin back-office actions are not gated by an employee clock-in.

The guard applies to Employee calls that create or update ticket field records, including:
- `POST /api/job-tickets/{jobTicketId}/work-entries`
- `POST /api/job-tickets/{jobTicketId}/parts`
- `POST /api/job-tickets/{jobTicketId}/parts/quick-add`
- Employee-safe job-ticket part updates that record technician-side field changes
- `POST /api/part-requests/job-ticket/{jobTicketId}`
- job-ticket file/photo upload paths
- job-ticket file/photo caption or visibility update paths
- job-ticket file/photo archive paths

Behavior:
- the employee must have an open `TimeEntry` for the same `jobTicketId`;
- an employee clocked into a different job ticket must open that ticket or clock out before recording field work on another ticket;
- missing matching clock-in returns a controlled validation error: `Clock in to this job ticket before recording field work.`;
- Manager/Admin users can continue back-office coordination and review actions without this employee clock-in gate;
- this guard does not change DTO shapes, role policies, backend enum values, schema, migrations, purchasing behavior, inventory behavior, recommendations, AI/scoring, automatic compatibility, or automatic approval.

## Reporting
Reporting endpoints are Manager/Admin-only JSON APIs. The Manager/Admin reports UI groups the existing endpoints into invoice/closeout, labor/parts, and service-history sections, then performs client-side CSV export from the currently loaded table rows. There is no server-side export job, invoice generation, payment workflow, customer portal workflow, recommendation engine, AI/scoring, automatic compatibility decision, or automatic approval behavior in this reporting slice.

Authorization: `ManagerOrAdmin`.

Shared list filters where supported:
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

Endpoints:
- `GET /api/reports/job-tickets/{jobTicketId}/invoice-ready`
  - Returns `InvoiceReadySummaryDto` for the selected job ticket or `404 Not Found`.
  - Uses approved labor entries and approved parts already captured for the ticket.
  - Labor cost/billable totals use time-entry labor-rate snapshots first, with legacy fallback to employee rate fields when a snapshot is absent.
  - This is invoice-ready reporting only; it does not generate invoices or collect payment.
- `GET /api/reports/job-tickets/{jobTicketId}/cost-summary`
  - Returns `JobCostSummaryDto` for the selected job ticket or `404 Not Found`.
  - Uses the same implemented invoice-ready summary behavior for approved labor, approved parts, and totals.
- `GET /api/reports/jobs-ready-to-invoice`
  - Returns `JobsReadyToInvoiceItemDto[]`.
  - Includes completed/reviewed, not-invoiced jobs with approved billable labor and/or approved parts according to existing service rules.
- `GET /api/reports/labor/by-job`
  - Returns `LaborByJobDto[]`.
  - Groups approved time-entry labor by job ticket and labels totals as time-entry labor-rate snapshot values.
- `GET /api/reports/labor/by-employee`
  - Returns `LaborByEmployeeDto[]`.
  - Groups approved time-entry labor by employee and labels totals as time-entry labor-rate snapshot values.
- `GET /api/reports/parts/by-job`
  - Returns `PartsByJobDto[]`.
  - Groups approved job parts by job using captured part cost and sale-price snapshots.
- `GET /api/reports/customers/{customerId}/service-history`
  - Returns `ServiceHistoryItemDto[]` for the selected customer.
- `GET /api/reports/equipment/{equipmentId}/service-history`
  - Returns `ServiceHistoryItemDto[]` for the selected equipment record.

Client CSV export behavior:
- CSV is produced in the Manager/Admin frontend from the rows currently loaded in the browser.
- CSV values use raw DTO values and report labels, not localized display formatting.
- Empty reports do not expose an export action.

## Parts Request Workflow Phase 2
The parts request API is a job-ticket-first workflow for technician-added ticket parts and back-office review. It uses DTOs and application services. No schema migration is required for Phase 2 because the existing job-ticket part model already stores catalog matches, unlisted parts, approval status, and office-order request flags.

### Technician add/request from ticket
- `POST /api/part-requests/job-ticket/{jobTicketId}`
- Authorization: `AssignedEmployeeOrManager`
- Request DTO: `CreatePartRequestDto`
  - `partDescription` required when no catalog `partId` is selected
  - `quantity` required and greater than zero
  - `notes` optional
  - `urgency` optional
  - `neededByUtc` optional
  - `partId` optional existing catalog match from the safe lookup
  - `needsOrdered` optional, defaults to `true`
- Response DTO: `PartRequestDto`
- Behavior:
  - Employee-created part requests require the assigned employee to be clocked into the same job ticket;
  - selecting `partId` records the existing catalog part number/name snapshot without exposing pricing to the technician;
  - omitting `partId` records the typed part as an unlisted ticket part;
  - `needsOrdered: true` marks the row for back-office/parts-manager review and includes it in `GET /api/part-requests`;
  - `needsOrdered: false` records the ticket part but does not create a queue item;
  - technician-created rows store zero cost and zero billable price snapshots and keep `isBillable` false until back-office review;
  - no inventory adjustment is performed by this path.

### Back-office queue
- `GET /api/part-requests?status={status}&search={text}&jobTicketId={jobTicketId}`
- Authorization: `ManagerOrAdmin`
- Returns only job-ticket parts marked `Needs ordered`, newest first.
- Optional filters:
  - `status` uses existing job-part approval status values;
  - `search` matches ticket number, job title, part number, or part name;
  - `jobTicketId` narrows the queue to a job selected from the authorized job-ticket lookup.

### Back-office detail
- `GET /api/part-requests/{id}`
- Authorization: `ManagerOrAdmin`
- Returns one Needs ordered part request DTO or `404 Not Found`.

### Back-office update
- `PUT /api/part-requests/{id}`
- Authorization: `ManagerOrAdmin`
- Request DTO: `UpdatePartRequestDto`
  - `partDescription`
  - `quantity`
  - `status` using existing job-part approval status values
  - `internalStatusNotes`
  - `unitCostSnapshot`
  - `salePriceSnapshot`
  - `isBillable`
  - `partId` optional catalog match
- Behavior:
  - Manager/Admin can update request status, internal notes, part cost snapshot, billable price snapshot, billable state, and optional catalog part match;
  - catalog match updates the job-ticket part snapshot to the existing catalog part number/name;
  - rejected requests store an internal rejection/status note fallback;
  - no purchase, receiving, vendor invoice, landed-cost, inventory, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior is added.

### `PartRequestDto`
- `id`
- `jobTicketId`
- `jobTicketNumber`
- `jobTicketTitle`
- `partId`
- `partNumber`
- `partName`
- `quantity`
- `notes`
- `technicianNotes`
- `requestNotes`
- `internalStatusNotes`
- `unitCostSnapshot` back-office response field
- `salePriceSnapshot` back-office response field
- `isBillable`
- `needsOrdered`
- `status`
- `requestedAtUtc`
- `requestedByEmployeeId`
- `approvedAtUtc`
- `rejectedAtUtc`
- `rejectionReason`

## Existing Job-Ticket Part Boundaries
- `POST /api/job-tickets/{jobTicketId}/parts` remains Manager/Admin catalog-backed part usage.
- Existing employee-safe job-ticket part responses continue to hide price snapshots when returned through employee contexts.
- Employee-created or employee-updated job-ticket part field records require an open time entry on the same job ticket.
- Technicians must not receive UI controls for part cost, billable price, vendor cost, purchase history, inventory transactions, catalog administration, or billing decisions.

## Existing Purchasing Support
The purchasing API is an implemented Manager/Admin baseline workflow. It supports purchase-order coordination, receipt recording, vendor invoice metadata, and landed-cost fields already present on `main`.

Authorization: `ManagerOrAdmin`.

Endpoints:
- `GET /api/purchase-orders?includeArchived={bool}&vendorId={vendorId}&status={status}`
- `GET /api/purchase-orders/{id}`
- `POST /api/purchase-orders`
- `PUT /api/purchase-orders/{id}`
- `POST /api/purchase-orders/{id}/submit`
- `POST /api/purchase-orders/{id}/receive`
- `POST /api/purchase-orders/{id}/cancel`
- `POST /api/purchase-orders/{id}/close`
- `POST /api/purchase-orders/{id}/archive`
- `POST /api/purchase-orders/{id}/unarchive`

Request/response DTOs include:
- `CreatePurchaseOrderDto` with `vendorId`, optional `purchaseOrderNumber`, optional ordered/expected dates, notes, and line requests.
- `UpdatePurchaseOrderDto` with purchase-order metadata, vendor invoice metadata, landed-cost fields, notes, and line requests.
- `ReceivePurchaseOrderDto` with optional received date and received line quantities.
- `PurchaseOrderDto`, `PurchaseOrderListItemDto`, and `PurchaseOrderLineDto` for Manager/Admin review screens.

Behavior:
- create/update paths validate vendor, part, line, date, invoice, and non-negative cost fields;
- submit, receive, cancel, and close are explicit state transitions;
- receive records inventory receipt transactions for newly received quantities;
- archive/unarchive preserve soft-delete behavior.

This section documents the existing baseline only. It does not approve new purchasing expansion, new receiving expansion, vendor invoice workflow expansion, accounting integration, invoice generation, payment tracking, replenishment, recommendation, AI/scoring, automatic compatibility, or automatic approval behavior.

## Existing Inventory Foundation
The inventory API is an implemented Manager/Admin baseline workflow for stock locations, current stock visibility, transaction review, purchase-order receipt transactions, and manual adjustments.

Authorization: `ManagerOrAdmin`.

Endpoints:
- `GET /api/inventory/stock-locations?offset={offset}&limit={limit}&includeArchived={bool}`
- `GET /api/inventory/stock-locations/{id}`
- `POST /api/inventory/stock-locations`
- `PUT /api/inventory/stock-locations/{id}`
- `POST /api/inventory/stock-locations/{id}/archive`
- `POST /api/inventory/stock-locations/{id}/unarchive`
- `GET /api/inventory/stock?stockLocationId={stockLocationId}&partId={partId}`
- `GET /api/inventory/transactions?stockLocationId={stockLocationId}&partId={partId}&limit={limit}`
- `POST /api/inventory/adjustments`

Request/response DTOs include:
- `StockLocationDto`, `CreateStockLocationDto`, and `UpdateStockLocationDto`.
- `InventoryStockSummaryDto` for current on-hand summaries.
- `InventoryTransactionDto` for receipt and manual-adjustment history.
- `CreateManualInventoryAdjustmentDto` for Manager/Admin manual adjustments.

Behavior:
- stock-location create/update validates required name and unique code;
- archive/unarchive preserve soft-delete behavior;
- stock summaries aggregate recorded inventory transactions by stock location and part;
- transaction review is filterable by stock location and part;
- manual adjustments require stock location, part, non-zero quantity delta, and reason.

This section documents the existing inventory foundation only. It does not approve warehouse/truck inventory expansion, transfer workflows, low-stock alerts, replenishment, average-cost or landed-cost inventory accounting expansion, recommendations, AI/scoring, automatic compatibility, or automatic approval behavior.

## Protected Boundaries
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- User-management endpoints under `/api/users` remain Admin-only except for the narrow Manager/Admin `GET /api/users/assignable-employees` lookup documented above.
- No backend enum numeric values are changed.
- No hard deletes are introduced.
- Deferred domains remain deferred unless explicitly selected: purchasing expansion, receiving expansion, vendor invoice expansion, landed cost expansion, warehouse/truck inventory, replenishment, recommendation engine, AI/scoring, automatic compatibility decisions, and automatic approval.

### Manager-first approval queue contract
- `GET /api/time-entries/review` accepts optional `employeeId`, `approvalStatus`, `dateFromUtc`, `dateToUtc`, and `search` filters. The `search` value matches job ticket ID/number, job title/type/description, customer, site, and location fields.
- Review results use the dedicated `TimeApprovalQueueItemDto`, retaining internal command IDs while exposing manager-facing employee, ticket, customer, site, location, job name, labor type, and note context.
- `POST /api/time-entries/bulk-approve` accepts only `{ timeEntryIds }` and approves completed entries that are still pending. The authenticated Manager/Admin identity is the approver.
- `POST /api/time-entries/{id}/edit-and-approve` accepts editable values plus a reason, then records the adjustment and approval atomically in one save. Actor identity and manager override authority are server-owned.
- Single approve has no request body, reject accepts only `{ reason }`, and adjustment requests contain only editable values plus the reason. All actions retain the `ManagerOrAdmin` authorization policy, and single/bulk approval share the same completed-pending eligibility rule.
