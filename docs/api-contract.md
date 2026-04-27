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

## Versioning
Planned: URL-based versioning (`/api/v1/...`) once endpoints stabilize.
