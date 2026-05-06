# API Layer

Place API clients and HTTP abstractions here.

## Public system metadata
- `systemApi.getInfo()` calls `GET /api/system/info`.
- Use this endpoint only for lightweight deployment diagnostics and frontend/API compatibility checks.
- Do not add business workflow logic to the system metadata client.

