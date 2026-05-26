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

### Inventory workflow status
- The inventory backend foundation is implemented on `main`.
- Purchase-order receiving now creates receipt inventory transactions on `main`.
- Manager/Admin inventory UI coverage is implemented on `main`.

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

## Existing Platform Contracts That Remain In Force
- Manager/Admin `/manage/purchasing` still uses the dedicated purchase-order workflow and the reorder-focused workbench.
- Parts usage history remains a visibility-only workflow and must not be interpreted as a compatibility recommendation engine.
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- Deferred domains remain deferred: truck inventory, transfers, replenishment, compatibility recommendations, and AI/scoring.
