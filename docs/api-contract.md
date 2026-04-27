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

### Behavior Notes
- Job tickets are soft archived (`IsDeleted = true`) and excluded by default query filters.
- `TicketNumber` is auto-generated as `JT-YYYY-000001` and incremented per year.
- Status transition to `Completed` sets `CompletedAtUtc`; leaving `Completed` clears it.
- Archive requests must provide `ArchiveReason`.
- Assignment API enforces one active assignment per employee per ticket.
- Work entries are note/description records only in this phase (no time tracking or file uploads).

## Versioning
Planned: URL-based versioning (`/api/v1/...`) once endpoints stabilize.
