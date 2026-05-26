# API Contract (Current Inventory Baseline)

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
### Implemented and active in the current baseline
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
- Inventory foundation plus warehouse transfer workflow (`/api/inventory/*`)

### Inventory workflow status
- The inventory backend foundation is implemented.
- Purchase-order receiving creates receipt inventory transactions.
- Manager/Admin inventory UI coverage is implemented.
- Manager/Admin warehouse transfer workflow is now implemented between existing active stock locations.

## Inventory (Current Baseline)
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

### Warehouse transfers
- `POST /api/inventory/transfers`

#### Warehouse transfer request DTO
- `CreateInventoryTransferDto`
  - `sourceStockLocationId`
  - `destinationStockLocationId`
  - `partId`
  - `quantity`
  - `reason`
  - `notes`
  - `occurredAtUtc`

#### Warehouse transfer response DTO
- `InventoryTransferDto`: `sourceTransactionId`, `destinationTransactionId`, `sourceStockLocationId`, `sourceStockLocationName`, `destinationStockLocationId`, `destinationStockLocationName`, `partId`, `partNumber`, `partName`, `quantity`, `occurredAtUtc`, `reason`, `notes`

#### Warehouse transfer behavior notes
- `sourceStockLocationId` and `destinationStockLocationId` are required and must both reference active stock locations.
- The source and destination locations must be different.
- `partId` is required and must reference an active part.
- `quantity` must be greater than zero.
- `reason` is required.
- Successful transfers create two `InventoryTransaction` rows with `TransactionType = Transfer`: one negative movement at the source location and one positive movement at the destination location.
- Transfer submission is rejected when the source location does not currently have enough stock for the requested part quantity.
- Transfer notes in transaction history include the counterpart warehouse location so source and destination movements remain reviewable in the shared transaction view.

### Inventory transaction shape
- `InventoryTransactionDto`: `id`, `stockLocationId`, `stockLocationName`, `partId`, `partNumber`, `partName`, `transactionType`, `quantityDelta`, `occurredAtUtc`, `reason`, `notes`, `purchaseOrderNumber`
- `InventoryStockSummaryDto`: `stockLocationId`, `stockLocationName`, `partId`, `partNumber`, `partName`, `quantityOnHand`, `lastTransactionAtUtc`

### Enum discipline
- `InventoryTransactionType` is appended only:
  - `1=Receipt`
  - `2=ManualAdjustment`
  - `3=Transfer`
- The current baseline creates `Receipt`, `ManualAdjustment`, and `Transfer` transactions.

## Purchase Orders (Current Baseline Notes)
- `POST /api/purchase-orders/{id}/receive` records vendor receiving progress.
- Receipt increases post `InventoryTransaction` entries tied to the purchase order and update `Part.QuantityOnHand`.
- Duplicate `LineId` entries are rejected.
- A line's recorded received quantity cannot decrease once saved.
- `receivedQuantity` cannot exceed `quantityOrdered`.

## Deferred Beyond The Current Inventory Baseline
- truck inventory;
- transfer workflows outside the bounded warehouse-to-warehouse Manager/Admin lane;
- replenishment automation;
- pick/reserve/issue automation;
- compatibility recommendations;
- AI/scoring.

## Existing Platform Contracts That Remain In Force
- Manager/Admin `/manage/purchasing` still uses the dedicated purchase-order workflow and the reorder-focused workbench.
- Parts usage history remains a visibility-only workflow and must not be interpreted as a compatibility recommendation engine.
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- Deferred domains remain deferred beyond the current transfer-enabled inventory baseline: truck inventory, replenishment, compatibility recommendations, and AI/scoring.
