# API Contract (Current Main State)

## Base URL
`/api`

## Health
- `GET /health`
  - Public and unauthenticated.
  - Returns the documented ASP.NET Core health payload.

## System Metadata
- `GET /api/system/info`
  - Public and unauthenticated.
  - Returns service name, API base path, health endpoint path, environment name, and assembly version.

## API Group Status
### Implemented and active on `main`
- Health (`/health`)
- System metadata (`/api/system/info`)
- Authentication (`/api/auth/*`)
- User management (`/api/users/*`)
- Master data (`/api/customers`, `/api/service-locations`, `/api/equipment`, `/api/vendors`, `/api/part-categories`, `/api/parts`)
- Job tickets (`/api/job-tickets/*`)
- Time entries (`/api/time-entries/*`)
- Reporting (`/api/reports/*`)
- Parts usage history visibility (`/api/parts/usage-history`)
- Purchase orders and vendor cost tracking (`/api/purchase-orders/*`)
- Inventory foundation (`/api/inventory/*`)

## Job Tickets (Current Main Notes)
- Manager/Admin create and update flows already support operational fields such as `jobType`, `purchaseOrderNumber`, `billingContactName`, `billingContactPhone`, `billingContactEmail`, `internalNotes`, `customerFacingNotes`, `requestedAtUtc`, `scheduledStartAtUtc`, and `dueAtUtc`.
- `equipmentId` remains optional, but when supplied it must belong to the selected `serviceLocationId`.
- Manager/Admin list and detail views use the existing assignment endpoints to surface assigned-employee counts, lead-tech visibility, and dispatch-readiness cues without changing the API surface.
- Manager/Admin detail/edit surfaces now provide inline status transition review, disable no-op status submissions, surface API validation messages, and keep archive confirmation explicit as a soft-delete/archive workflow rather than hard delete.
- Job-ticket-first UI work should keep those existing fields visible and editable rather than introducing a separate workflow for the same context.

## Reporting And Time Review (Current Main Notes)
- Existing `/api/reports/*` endpoints remain the reporting API surface. Reports polish stays client-side by improving loaded-row review context, filter reset behavior, export-friendly table presentation, and CSV export from already-loaded rows.
- Manager/Admin reporting surfaces now label labor money columns as snapshot-first to clarify that approved time-entry snapshots are used before any legacy fallback rate behavior.
- Manager/Admin time review still uses existing `/api/time-entries/job/{jobTicketId}`, `/api/time-entries/{id}/approve`, and `/api/time-entries/{id}/reject` endpoints. The polish layer is UI-only: visible-row filters, summary counts, export-friendly loaded tables, and visible-row CSV export on top of the loaded job slice.

## Current Scope Interpretation
- The product is being steered as a job-ticket-first platform.
- Purchase-order and inventory endpoints already implemented on `main` remain valid, but they should be understood as supporting capabilities rather than the main product-growth path.
- No transfer endpoints are implemented on `main`.
- No inventory-expansion API lane is currently approved.

## Inventory (Current Main Foundation)
All inventory endpoints require the existing `ManagerOrAdmin` authorization policy and return DTOs only.

### Stock locations
- `GET /api/inventory/stock-locations`
  - Query params: `offset` (default `0`), `limit` (default `50`), `includeArchived` (default `false`).
- `GET /api/inventory/stock-locations/{id}`
- `POST /api/inventory/stock-locations`
- `PUT /api/inventory/stock-locations/{id}`
- `POST /api/inventory/stock-locations/{id}/archive`
- `POST /api/inventory/stock-locations/{id}/unarchive`

#### Stock location DTOs
- `StockLocationDto`: `id`, `name`, `code`, `description`, `isActive`, `isArchived`
- `CreateStockLocationDto`: `name`, `code`, `description`
- `UpdateStockLocationDto`: `name`, `code`, `description`, `isActive`

#### Stock location behavior notes
- `name` and `code` are required.
- `code` is normalized to uppercase and must be unique.
- Archive uses soft-delete behavior and also marks the location inactive.
- Unarchive can return `400 Bad Request` when restore validation fails and `404 Not Found` when the target location does not exist.

### Stock visibility
- `GET /api/inventory/stock`
  - Optional query params: `stockLocationId`, `partId`
  - Returns grouped stock visibility derived from persisted inventory transactions.

### Transaction history
- `GET /api/inventory/transactions`
  - Optional query params: `stockLocationId`, `partId`, `limit` (default `100`, clamped to `1..200`)
  - Returns recent inventory transaction DTOs ordered newest first.

### Manual adjustments
- `POST /api/inventory/adjustments`

#### Manual adjustment request DTO
- `CreateManualInventoryAdjustmentDto`
  - `stockLocationId`
  - `partId`
  - `quantityDelta`
  - `reason`
  - `notes`
  - `occurredAtUtc`

#### Manual adjustment behavior notes
- `stockLocationId` is required and must reference an active stock location.
- `partId` is required and must reference an active part.
- `quantityDelta` must not be zero.
- `reason` is required.
- Successful adjustments create an `InventoryTransaction` row with `TransactionType = ManualAdjustment` and then recalculate `Part.QuantityOnHand` from persisted inventory history for that part.

### Inventory transaction shape
- `InventoryTransactionDto`: `id`, `stockLocationId`, `stockLocationName`, `partId`, `partNumber`, `partName`, `transactionType`, `quantityDelta`, `occurredAtUtc`, `reason`, `notes`, `purchaseOrderNumber`
- `InventoryStockSummaryDto`: `stockLocationId`, `stockLocationName`, `partId`, `partNumber`, `partName`, `quantityOnHand`, `lastTransactionAtUtc`

### Enum discipline
- `InventoryTransactionType` is appended only:
  - `1=Receipt`
  - `2=ManualAdjustment`
- `main` now creates both `Receipt` and `ManualAdjustment` transactions.

## Purchase Orders (Current Main Notes)
- `POST /api/purchase-orders/{id}/receive` records vendor receiving progress.
- Receipt increases now post `InventoryTransaction` entries tied to the purchase order and update `Part.QuantityOnHand`.
- Duplicate `LineId` entries are rejected.
- A line's recorded received quantity cannot decrease once saved.
- `receivedQuantity` cannot exceed `quantityOrdered`.

## API Growth Boundary
Until scope is explicitly expanded again, API growth should stay centered on:
- job-ticket workflows;
- time-entry workflows;
- parts-on-ticket workflows;
- Manager/Admin behavior that directly supports job-ticket operations.

Do not expand the API surface into transfer workflows, truck inventory, replenishment automation, pick/reserve/issue automation, compatibility recommendations, or AI/scoring under the current roadmap.

## Existing Platform Contracts That Remain In Force
- Manager/Admin `/manage/purchasing` still uses the dedicated purchase-order workflow and the reorder-focused workbench.
- Parts usage history remains a visibility-only workflow and must not be interpreted as a compatibility recommendation engine.
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- Deferred domains remain deferred: inventory expansion beyond the current support baseline, truck inventory, replenishment, compatibility recommendations, and AI/scoring.
