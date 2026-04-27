# Database Design (Initial)

## Engine
Microsoft SQL Server

## ORM
Entity Framework Core

## Proposed Initial Entities
- `Tickets`
- `Users`
- `TicketComments`
- `TicketAttachments`
- `TicketStatusHistory`

## Design Notes
- Use `uniqueidentifier` for primary keys.
- Include `CreatedAtUtc` and `UpdatedAtUtc` for core tables.
- Use lookup/reference tables for statuses and priorities where needed.
- Keep schema migration-first using EF Core migrations.

## Connection Strategy
Use a standard SQL Server connection string via:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=JobTicketDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
}
```
