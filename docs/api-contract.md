# API Contract (Current Main State Plus Parts Request Workflow Phase 2)

## Consistency Standard
- Keep the same workflow names, status labels, and section order used by the live UI and the other steering docs.
- If a workflow or label changes, update the contract, scope, and wiki in the same change so the docs describe one system.
- Prefer one term per concept instead of alternating labels for the same behavior.

## Schema Redesign Planning Boundary

[Schema Redesign Domain Contract](./schema-redesign-domain-contract.md) defines the proposed target terminology and module responsibilities for Epic 0. It does not add or change an API contract.

All routes and DTOs in this document describe the implemented baseline. In particular, `/api/equipment` continues to identify the customer's physical unit, and `/api/equipment/{equipmentId}/compatible-parts` continues to use the current per-equipment behavior until a later approved compatibility slice is implemented. Future catalog, asset, fitment, installation, contact, address, note, supplier-offer, and rate-history endpoints require separate approval and documentation before implementation.

## Base URL
`/api`

## Public Endpoints
- `GET /health` is public and unauthenticated.
- `GET /api/system/info` is public and unauthenticated.
- `GET /api/company-configuration` is public and unauthenticated so the UI can apply company branding before sign-in.
- `GET /api/company-configuration/logo` is public and unauthenticated when a logo has been uploaded.

## Implemented API Groups
- Authentication (`/api/auth/*`)
- Company configuration and branding (`/api/company-configuration/*`)
- Ticket status filter configuration (`/api/ticket-status-filters`)
- User management (`/api/users/*`)
- Assignable employee lookup (`/api/users/assignable-employees`)
- Master data (`/api/customers`, `/api/service-locations`, `/api/equipment`, `/api/vendors`, `/api/part-categories`, `/api/parts`)
- Technician-safe part lookup (`/api/parts/lookup`)
- Equipment compatible parts catalog (`/api/equipment/{equipmentId}/compatible-parts`)
- Job tickets (`/api/job-tickets/*`)
- Job-ticket files/photos (`/api/job-tickets/{jobTicketId}/files/*`)
- Time entries (`/api/time-entries/*`)
- Scheduling (`/api/scheduling/*`)
- Reporting (`/api/reports/*`)
- Application error logs (`/api/error-logs/*`)
- Parts usage history visibility (`/api/parts/usage-history`)
- Parts request workflow Phase 2 (`/api/part-requests/*`)
- Purchase orders and vendor cost tracking (`/api/purchase-orders/*`)
- Inventory API foundation (`/api/inventory/*`, currently hidden from Manager/Admin navigation and client wiki)

## Company Configuration And Branding
Company Configuration stores the crane company's own profile, logo, and color scheme. It is separate from customer/account master data used to identify who the work is for.

Endpoints:
- `GET /api/company-configuration`
  - Authorization: public.
  - Returns `CompanyConfigurationDto`.
  - Used by the UI shell, login screen, report preview, and client-side exports.
- `PUT /api/company-configuration`
  - Authorization: `AdminOnly`.
  - Request DTO: `UpdateCompanyConfigurationDto`.
  - Creates or updates the singleton company profile row.
- `POST /api/company-configuration/logo`
  - Authorization: `AdminOnly`.
  - Request: multipart form file field named `file`.
  - Accepts JPG/JPEG, PNG, or WebP images up to 2 MB.
  - Validates extension, content type, file size, and file signature before storage.
- `GET /api/company-configuration/logo`
  - Authorization: public.
  - Streams the uploaded logo or returns `404 Not Found` when no logo is available.
- `GET /api/company-configuration/notification-recipients`
  - Authorization: `AdminOnly`.
  - Returns `NewTicketNotificationRecipientDto[]`.
- `POST /api/company-configuration/notification-recipients`
  - Authorization: `AdminOnly`.
  - Request DTO: `AddNewTicketNotificationRecipientDto`.
  - Adds a new-ticket notification recipient.
- `DELETE /api/company-configuration/notification-recipients/{id}`
  - Authorization: `AdminOnly`.
  - Removes a new-ticket notification recipient.

`CompanyConfigurationDto` includes:
- company profile fields: `companyName`, `legalName`, `contactName`, `email`, `phone`, `website`, address fields;
- brand fields: `primaryColor`, `secondaryColor`, `accentColor`;
- notification routing fields: `partOrderRequestsEmail`, `newTicketNotificationsEnabled`, and `newTicketNotificationMinimumPriority`;
- logo metadata: `hasLogo`, original file name, content type, file size, upload time;
- audit timestamps.

The feature adds the `CompanyConfigurations` table. It does not change `Customers`, customer selection, job-ticket customer/billing-party fields, service-location relationships, or master-data customer APIs.

## Mailer Configuration
Mailer configuration controls the outgoing account used by new-ticket and part-order notification emails. Runtime SMTP environment variables remain a fallback when no database mailer configuration row exists.

Endpoints:
- `GET /api/mailer-configuration`
  - Authorization: `AdminOnly`.
  - Returns current provider, status, SMTP host/port/SSL, Microsoft 365 tenant/client/sender details, sender identity, saved-secret flags, test status, and whether values came from environment fallback or the database row.
- `PUT /api/mailer-configuration`
  - Authorization: `AdminOnly`.
  - Request DTO: `UpdateMailerConfigurationDto`.
  - Creates or updates the singleton mailer row. SMTP passwords and Microsoft 365 client secrets are accepted only as write-only values and are stored through server-side protection.
- `POST /api/mailer-configuration/test`
  - Authorization: `AdminOnly`.
  - Request DTO: `SendMailerTestRequestDto` with `recipientEmail`.
  - Sends a test email with the saved mailer settings and records the latest test result on the database row when one exists.

Implemented providers are `ManualSmtp` and `Microsoft365`. Microsoft 365 uses application Graph mail with tenant ID or tenant domain, application client ID, write-only client secret, and sender mailbox. The application registration must have Microsoft Graph `Mail.Send` application permission with admin consent, and the sender mailbox is the `/users/{sender}/sendMail` mailbox used for system notifications. A configured Microsoft 365 provider reports `Connected via Microsoft 365 Graph.` Google Workspace remains represented as a future OAuth provider and is rejected by the API until that flow is implemented.

## Application Error Logs
Application error logs provide a private Admin review screen for server exceptions, browser errors, and failed API requests. They are for operational troubleshooting only and do not expose error review to Manager or Employee users.

Endpoints:
- `GET /api/error-logs`
  - Authorization: `AdminOnly`.
  - Query parameters: `limit` (1-500, default 100), optional `source`, and optional `search`.
  - Returns newest `ApplicationErrorLogDto[]` records first.
- `POST /api/error-logs/client`
  - Authorization: `EmployeeOrAbove`.
  - Request DTO: `ClientErrorLogRequestDto`.
  - Records best-effort browser and failed API request details for later Admin review.

`ApplicationErrorLogDto` includes:
- `id`
- `occurredAtUtc`
- `severity`
- `source` (`Server`, `Client`, or `ApiRequest`)
- `message`
- `cause`
- `location`
- `requestPath`
- `requestMethod`
- `userId`
- `userRole`
- `userAgent`
- `stackTrace`
- `metadataJson`

Server-side unhandled exceptions are captured by API middleware after authentication, including the authenticated user when available, request method/path, endpoint display name, user agent, stack trace, and trace metadata. Browser-side unhandled errors and failed API responses with HTTP 500+ are reported by the frontend on a best-effort basis. Error reporting must never block the user workflow or create a reporting loop.

## Ticket Status Filter Configuration
Ticket status filter configuration controls which configurable status filter choices appear in the Manager/Admin job-ticket queue. It maps labels to existing `JobTicketStatus` values only; it is not a custom workflow engine and does not add statuses or transitions.

Endpoints:
- `GET /api/ticket-status-filters`
  - Authorization: `ManagerOrAdmin`.
  - Returns `TicketStatusFilterOptionDto[]` ordered by `displayOrder`.
  - If no rows exist, returns the default active field-work filters: Submitted, Assigned, In Progress, Waiting on Parts, and Waiting on Customer.
- `PUT /api/ticket-status-filters`
  - Authorization: `AdminOnly`.
  - Request DTO: `SaveTicketStatusFilterConfigurationDto`.
  - Creates or updates filter rows without hard-deleting omitted or inactive rows.
  - Rejects invalid ticket statuses and duplicate active status mappings.

`TicketStatusFilterOptionDto` includes:
- `id`
- `displayLabel`
- `status` using existing `JobTicketStatus` numeric values
- `displayOrder`
- `isActive`

The feature adds the `TicketStatusFilterOptions` table and seeds the same default active field-work filters. It does not change backend enum numeric values, job-ticket status labels, job-ticket lifecycle rules, reports, assignment rules, or employee assignments.

## Equipment Compatible Parts Catalog
The equipment compatible parts catalog lets Managers/Admins maintain a list of known-compatible parts per equipment record with optional notes and a PM (preventative-maintenance) flag. It also surfaces read-only part usage history for that equipment in the same tab.

Authorization: `ManagerOrAdmin`.

Endpoints:
- `GET /api/equipment/{equipmentId}/compatible-parts`
  - Returns `EquipmentCompatiblePartsDto` containing the `catalogItems` list and a `partHistory` read-only section.
- `POST /api/equipment/{equipmentId}/compatible-parts`
  - Request DTO: `AddEquipmentCompatiblePartDto` with `partId`, optional `notes`, and optional `isPmPart`.
  - Adds a part to the catalog for the equipment record.
- `DELETE /api/equipment/{equipmentId}/compatible-parts/{partId}`
  - Removes a part from the catalog for the equipment record.
- `PATCH /api/equipment/{equipmentId}/compatible-parts/{partId}`
  - Request DTO: `UpdateEquipmentCompatiblePartDto` with `notes` and `isPmPart`.
  - Updates notes and PM flag for an existing catalog entry.

`EquipmentCompatiblePartDto` includes:
- `partId`
- `partNumber`
- `partName`
- `notes`
- `isPmPart`

`EquipmentPartHistoryDto` includes:
- `partId`
- `partNumber`
- `partName`
- `lastUsedOnTicketNumber`
- `usageCount`

This catalog is a Manager/Admin reference tool. It does not expose part cost, billable price, vendor cost, inventory, or billing controls, and it does not automate compatibility decisions, purchase orders, or approval workflows.

## Job Ticket Display Fields
Job-ticket list and detail responses keep relationship IDs for API operations and also include human-readable fields for UI display.

- `JobTicketListItemDto` includes `customerName`, `serviceLocationName`, optional `equipmentId`, and optional `equipmentName`.
- `JobTicketDto` includes `customerName`, `serviceLocationName`, `billingPartyCustomerName`, optional `equipmentName`, optional `equipmentNumber`, and optional `assignedManagerEmployeeName`.
- `equipmentId` identifies the customer's crane/equipment being serviced on the job ticket. It is not a dispatched crane assignment. Employee assignments remain separate job-ticket assignment records.
- Employee and Manager/Admin screens display readable labels instead of exposing customer, service-location, equipment, or employee GUIDs.
- Job-ticket display authorization, existing enum values, and write request DTOs are unchanged. The list response still includes the optional service-equipment ID needed to preserve the customer's crane/equipment selection on the ticket.
- Job-ticket create/update validates user-entered text before persistence: `title` 200 characters, `description` 4,000, `jobType` 100, `purchaseOrderNumber` 100, billing contact name 200, billing contact phone 50, billing contact email 320, `internalNotes` 4,000, and `customerFacingNotes` 4,000.
- For Employee users, `GET /api/job-tickets` returns assigned tickets except fully closed statuses (`Completed`, `Cancelled`, `Invoiced`, and `Reviewed`). Manager/Admin list views still return those tickets unless a filter excludes them.

## Scheduling Module
The scheduling module gives Managers/Admins three views for coordinating work without adding a separate dispatch entity or lifecycle.

Authorization: `ManagerOrAdmin`.

Job tickets carry an optional `estimatedDurationMinutes` field that can be set through the existing ticket update endpoint.

Endpoints:
- `GET /api/scheduling/unscheduled`
  - Returns `SchedulableTicketDto[]` — open tickets that have no `ScheduledStartUtc`, sorted by priority.
- `GET /api/scheduling/calendar?startUtc={startUtc}&endUtc={endUtc}`
  - Returns `SchedulableTicketDto[]` — tickets with a `ScheduledStartUtc` in the requested date window.
- `GET /api/scheduling/by-technician?startUtc={startUtc}&endUtc={endUtc}`
  - Returns `TechnicianScheduleDto[]` — scheduled tickets in the date window grouped by assigned employee.
- `POST /api/scheduling/{ticketId}/schedule`
  - Request DTO: `ScheduleTicketDto` with `scheduledStartUtc`, optional `estimatedDurationMinutes`, and optional `assignedEmployeeId`.
  - Sets the scheduled start on an existing ticket and optionally assigns a technician and records estimated duration.

`SchedulableTicketDto` includes `id`, `ticketNumber`, `title`, `status`, `priority`, `customerName`, `serviceLocationName`, `scheduledStartUtc`, `estimatedDurationMinutes`, and `assignedEmployeeName`.

`TechnicianScheduleDto` includes `employeeId`, `employeeName`, and a `tickets` list of `SchedulableTicketDto`.

This module does not add a dispatch-job table, backend dispatch enum, automatic scheduling engine, automatic approval, or invoice-generation behavior.

## Job Ticket Assignment And Schedule Workflow
The Manager/Admin Job Tickets screen is the main workflow for creating, assigning, scheduling, and reviewing work. The legacy `/manage/dispatch` route redirects to `/manage/schedule`.

Existing APIs used:
- `GET /api/job-tickets`
- `GET /api/job-tickets/{jobTicketId}`
- `PUT /api/job-tickets/{jobTicketId}`
- `POST /api/job-tickets/{jobTicketId}/status`
- `GET /api/job-tickets/{jobTicketId}/assignments`
- `POST /api/job-tickets/{jobTicketId}/assignments`
- `DELETE /api/job-tickets/{jobTicketId}/assignments/{employeeId}`
- `POST /api/job-tickets/{jobTicketId}/work-entries`
- `GET /api/equipment`
- `GET /api/users/assignable-employees`

Behavior:
- the queue displays existing job-ticket status labels instead of a separate dispatch lifecycle;
- the Status filter uses Admin-configured labels mapped to existing `JobTicketStatus` values;
- Quick Views apply frontend filters for active work, waiting work, missing due dates, unassigned tickets, needs-review tickets, and ready-to-work tickets;
- assignment review uses existing job-ticket assignment records and the existing lead-assignment flag;
- schedule and due date updates use the existing job-ticket update API;
- matching service equipment on more than one ticket is not treated as a dispatch resource conflict;
- ticket review/finalization and billing-ready review remain in the existing ticket workspace and Reports workflows.

This workflow does not add a backend dispatch-job record or API, backend dispatch status enum, Dispatch-specific schema migration, automatic scheduling, automatic approval, invoice generation, customer signature API, or billing/payment API.

## Manager/Admin Master Data
Manager/Admin master-data UI polish uses the existing master-data endpoints listed above. Expanded create/edit forms send the documented DTO fields for customer contact/account details, customer billing or mailing address details, service-location contact/status/address/site context/customer association, equipment ownership/billing/model/serial/type details, vendor contact/account details, part category descriptions, and part description/stock/reorder values.

Customer DTOs include `billingAddressLine1`, `billingAddressLine2`, `billingCity`, `billingState`, and `billingPostalCode` so a requesting customer or billing-party customer can carry complete billing contact context.

Service-location DTOs include `onSiteContactName`, `onSiteContactPhone`, `onSiteContactEmail`, `addressLine2`, `parishCounty`, `gateCode`, `accessInstructions`, `safetyRequirements`, and `siteNotes` in addition to the existing company, location, city, state, postal code, country, active, and customer-link fields.

This UI polish does not add endpoints, change authorization, add schema or migrations, alter enum values, or expand purchasing, receiving, landed-cost, inventory, recommendation, AI/scoring, automatic compatibility, or automatic approval scope.

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
- Results include manager-facing employee/job/customer/location labels and are ordered by newest `startedAtUtc` first. Approval, rejection, edit, and delete actions continue to use Manager/Admin-only action endpoints.
- `POST /api/time-entries/{id}/adjust` accepts editable time values plus a manager/admin reason and saves the edit without changing the current approval status.
- `DELETE /api/time-entries/{id}` accepts `{ reason }`, requires `ManagerOrAdmin`, and soft-deletes the time entry so it no longer appears in review or reporting queries. It does not hard-delete the row.
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

## Job-Ticket Files And Photos

Job-ticket file/photo upload continues to use:

- `POST /api/job-tickets/{jobTicketId}/files`
- Authorization: `AssignedEmployeeOrManager`

Accepted file types:

- JPG/JPEG;
- PNG;
- WebP;
- PDF.

The maximum upload size is 50 MB. The same limit is enforced by the HTTP controller and the application service.

Employee uploads, file caption/visibility updates, and file archives remain subject to the employee field-recording guard above. Manager/Admin users can continue ticket file/photo review and invoice-attachment coordination without an employee clock-in gate.

## Reporting
Reporting endpoints are Manager/Admin-only JSON APIs. The Manager/Admin reports UI groups the existing endpoints into job, labor, and parts/service report pages, then performs browser print/PDF output from generated report views and client-side CSV export from currently loaded table rows. Invoice-ready review also has a frontend packet view backed by the existing invoice-ready summary endpoint. There is no server-side PDF renderer, server-side export job, invoice generation, payment workflow, customer portal workflow, recommendation engine, AI/scoring, automatic compatibility decision, or automatic approval behavior in this reporting slice.

Authorization: `ManagerOrAdmin`.

Shared list filters where supported:
- `jobTicketId`
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
  - Supports `jobTicketId` to narrow the grouped result to one selected ticket.
- `GET /api/reports/customers/{customerId}/service-history`
  - Returns `ServiceHistoryItemDto[]` for the selected customer.
- `GET /api/reports/equipment/{equipmentId}/service-history`
  - Returns `ServiceHistoryItemDto[]` for the selected equipment record.

Client export behavior:
- Report print uses the browser print dialog from the generated report results screen. The invoice-ready packet view exposes browser print and a client-generated PDF download from the same invoice-ready JSON payload.
- CSV is produced in the Manager/Admin frontend from the rows currently loaded in the browser.
- Company Configuration profile details are included in generated report headers and CSV metadata when available.
- CSV values use raw DTO values and report labels, not localized display formatting.
- Empty reports do not expose CSV or print/save-PDF export actions.
- The frontend validates required source IDs, date ranges, and paging values before calling these existing report endpoints. This does not add a server-side export, reporting job, or new reporting API.

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

## Existing Inventory API Foundation
The inventory API foundation exists for stock locations, current stock visibility, transaction review, purchase-order receipt transactions, and manual adjustments. The Manager/Admin Inventory screen is currently hidden from navigation and omitted from the client wiki because the workflow is not complete enough for client use.

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

This section documents the existing inventory API foundation only. It does not approve reintroducing the Inventory UI, warehouse/truck inventory expansion, transfer workflows, low-stock alerts, replenishment, average-cost or landed-cost inventory accounting expansion, recommendations, AI/scoring, automatic compatibility, or automatic approval behavior.

## Manager/Admin Navigation Routes
All routes under `/manage` require Manager or Admin role. Routes under `/manage/users`, `/manage/company-configuration`, `/manage/alerts`, `/manage/mailer-settings`, `/manage/error-logs`, and `/manage/ticket-status-filters` require Admin role.

- `/manage`: Manager/Admin dashboard.
- `/manage/job-tickets`: job-ticket queue.
- `/manage/job-tickets/new`: create job ticket.
- `/manage/job-tickets/{jobTicketId}`: job-ticket workspace.
- `/manage/schedule`: dedicated scheduling screen (Unscheduled Queue, By Date, By Technician).
- `/manage/customers`: customers.
- `/manage/service-locations`: service locations.
- `/manage/equipment`: equipment (includes Compatible Parts tab when a record is open).
- `/manage/parts`: parts, vendors, and part categories.
- `/manage/part-requests`: parts request queue.
- `/manage/purchasing`: purchasing support.
- `/manage/parts-usage-history`: parts usage history visibility.
- `/manage/travel-time`: travel time report for technician travel entries.
- `/manage/time-approval`: time approval queue.
- `/manage/parts-approval`: parts approval workflow.
- `/manage/reports`: Job Reports page.
- `/manage/reports/labor`: Labor Reports page.
- `/manage/reports/parts-service`: Parts & Service Reports page.
- `/manage/reports/invoice-ready/{jobTicketId}`: invoice-ready packet view for a selected ticket.
- `/manage/wiki`: in-app system wiki.
- `/manage/company-configuration`: Admin-only company profile, logo, and color settings.
- `/manage/alerts`: Admin-only alert recipients and notification routing.
- `/manage/mailer-settings`: Admin-only outgoing mailer provider, SMTP or Microsoft 365 Graph connection, sender identity, and test email settings.
- `/manage/error-logs`: Admin-only private application error review.
- `/manage/ticket-status-filters`: Admin-only ticket status filter configuration.
- `/manage/users`: Admin-only user management.
- `/manage/dispatch`: legacy redirect to `/manage/schedule`.
- `/manage/reports/labor-parts-service`: legacy report bookmark route that redirects to `/manage/reports/labor`.

## Protected Boundaries
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- `/manage/company-configuration` remains Admin-only.
- `/manage/alerts` remains Admin-only.
- `/manage/mailer-settings` remains Admin-only.
- `/manage/error-logs` remains Admin-only.
- `/manage/ticket-status-filters` remains Admin-only.
- `GET /api/error-logs` remains Admin-only; `POST /api/error-logs/client` accepts authenticated Employee, Manager, and Admin users only for best-effort error reporting.
- `GET /api/ticket-status-filters` is Manager/Admin-readable; `PUT /api/ticket-status-filters` remains Admin-only.
- User-management endpoints under `/api/users` remain Admin-only except for the narrow Manager/Admin `GET /api/users/assignable-employees` lookup documented above.
- Admin user-management list search and role/status filters are frontend-only over the loaded `/api/users` results; they do not add query parameters or new user-management endpoints.
- No backend enum numeric values are changed.
- No hard deletes are introduced.
- `ClockInLatitude` and `ClockInLongitude` are nullable on the `TimeEntry` entity and in the `TimeEntryDto`. Clock-in and clock-out requests that omit coordinates are accepted; the backend does not require GPS data to complete either action.
- Deferred domains remain deferred unless explicitly selected: purchasing expansion, receiving expansion, vendor invoice expansion, landed cost expansion, warehouse/truck inventory, replenishment, recommendation engine, AI/scoring, automatic compatibility decisions, and automatic approval.

### Manager-first approval queue contract
- `GET /api/time-entries/review` accepts optional `employeeId`, `approvalStatus`, `dateFromUtc`, `dateToUtc`, and `search` filters. The `search` value matches job ticket ID/number, job title/type/description, customer, site, and location fields.
- Review results use the dedicated `TimeApprovalQueueItemDto`, retaining internal command IDs while exposing manager-facing employee, ticket, customer, site, location, job name, labor type, and note context.
- `POST /api/time-entries/bulk-approve` accepts only `{ timeEntryIds }` and approves completed entries that are still pending. The authenticated Manager/Admin identity is the approver.
- `POST /api/time-entries/{id}/edit-and-approve` accepts editable values plus a reason, then records the adjustment and approval atomically in one save. Actor identity and manager override authority are server-owned.
- Single approve has no request body, reject accepts only `{ reason }`, delete accepts only `{ reason }`, and adjustment requests contain only editable values plus the reason. All actions retain the `ManagerOrAdmin` authorization policy, and single/bulk approval share the same completed-pending eligibility rule.
