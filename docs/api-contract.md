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

## Versioning
Planned: URL-based versioning (`/api/v1/...`) once endpoints stabilize.
