# API Contract (Current Main State Plus Parts Request Workflow Phase 1)

## Base URL
`/api`

## Public Endpoints
- `GET /health` is public and unauthenticated.
- `GET /api/system/info` is public and unauthenticated.

## Implemented API Groups
- Authentication (`/api/auth/*`)
- User management (`/api/users/*`)
- Master data (`/api/customers`, `/api/service-locations`, `/api/equipment`, `/api/vendors`, `/api/part-categories`, `/api/parts`)
- Job tickets (`/api/job-tickets/*`)
- Job-ticket files/photos (`/api/job-ticket-files/*`)
- Time entries (`/api/time-entries/*`)
- Reporting (`/api/reports/*`)
- Parts usage history visibility (`/api/parts/usage-history`)
- Parts request workflow Phase 1 (`/api/part-requests/*`)
- Purchase orders and vendor cost tracking (`/api/purchase-orders/*`)
- Inventory foundation (`/api/inventory/*`)

## Parts Request Workflow Phase 1
The parts request API is a job-ticket-first workflow for technician-submitted part needs and back-office review. It uses DTOs and stores requests as office-review job-ticket part records; no new schema is required for Phase 1.

### Technician create request
- `POST /api/part-requests/job-ticket/{jobTicketId}`
- Authorization: `AssignedEmployeeOrManager`
- Request DTO: `CreatePartRequestDto`
  - `partDescription` required
  - `quantity` required and greater than zero
  - `notes` optional
  - `urgency` optional
  - `neededByUtc` optional
- Response DTO: `PartRequestDto`
- Technician behavior:
  - creates an unlisted job-ticket part marked for office/back-office review;
  - stores zero cost and zero billable price snapshots;
  - keeps `isBillable` false;
  - does not adjust inventory;
  - does not create purchase orders, receiving, vendor invoice rows, landed cost, inventory transactions, recommendations, AI/scoring, automatic compatibility decisions, or automatic approvals.

### Back-office queue
- `GET /api/part-requests`
- Authorization: `ManagerOrAdmin`
- Returns all current part request DTOs ordered newest first.

### Back-office detail
- `GET /api/part-requests/{id}`
- Authorization: `ManagerOrAdmin`
- Returns one part request DTO or `404 Not Found`.

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
  - rejected requests require an internal rejection/status note fallback;
  - no purchase, receiving, vendor invoice, landed-cost, inventory, recommendation, AI/scoring, or automatic compatibility behavior is added.

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
- `status`
- `requestedAtUtc`
- `requestedByEmployeeId`
- `approvedAtUtc`
- `rejectedAtUtc`
- `rejectionReason`

## Existing Job-Ticket Part Boundaries
- `POST /api/job-tickets/{jobTicketId}/parts` remains Manager/Admin catalog-backed part usage.
- Existing employee-safe job-ticket part responses continue to hide price snapshots when returned through employee contexts.
- Technicians must not receive UI controls for part number, part cost, billable price, vendor cost, purchase history, inventory transactions, or billing decisions.

## Protected Boundaries
- `/manage` remains Manager/Admin-only.
- `/manage/users` remains Admin-only.
- No backend enum numeric values are changed.
- No hard deletes are introduced.
- Deferred domains remain deferred unless explicitly selected: purchasing expansion, receiving expansion, vendor invoice expansion, landed cost expansion, warehouse/truck inventory, replenishment, recommendation engine, AI/scoring, automatic compatibility decisions, and automatic approval.
