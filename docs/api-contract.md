# API Contract (Current Main State Plus Parts Request Workflow Phase 2)

## Base URL
`/api`

## Public Endpoints
- `GET /health` is public and unauthenticated.
- `GET /api/system/info` is public and unauthenticated.

## Implemented API Groups
- Authentication (`/api/auth/*`)
- User management (`/api/users/*`)
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

## Technician-Safe Part Lookup
- `GET /api/parts/lookup?offset=0&limit=50`
- Authorization: `EmployeeOrAbove`
- Response DTO: `PartLookupDto`
  - `id`
  - `partNumber`
  - `name`
  - `description`
- This endpoint is safe for technician in-ticket search. It does not return part cost, billable price, vendor cost, purchase history, inventory quantity, reorder thresholds, billing controls, or catalog-admin fields.

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
  - selecting `partId` records the existing catalog part number/name snapshot without exposing pricing to the technician;
  - omitting `partId` records the typed part as an unlisted ticket part;
  - `needsOrdered: true` marks the row for back-office/parts-manager review and includes it in `GET /api/part-requests`;
  - `needsOrdered: false` records the ticket part but does not create a queue item;
  - technician-created rows store zero cost and zero billable price snapshots and keep `isBillable` false until back-office review;
  - no inventory adjustment is performed by this path.

### Back-office queue
- `GET /api/part-requests?status={status}&search={text}`
- Authorization: `ManagerOrAdmin`
- Returns only job-ticket parts marked `Needs ordered`, newest first.
- Optional filters:
  - `status` uses existing job-part approval status values;
  - `search` matches ticket number, job title, part number, or part name.

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
- Technicians must not receive UI controls for part cost, billable price, vendor cost, purchase history, inventory transactions, catalog administration, or billing decisions.

## Protected Boundaries
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- No backend enum numeric values are changed.
- No hard deletes are introduced.
- Deferred domains remain deferred unless explicitly selected: purchasing expansion, receiving expansion, vendor invoice expansion, landed cost expansion, warehouse/truck inventory, replenishment, recommendation engine, AI/scoring, automatic compatibility decisions, and automatic approval.
