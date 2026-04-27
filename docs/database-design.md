# Database Design (Initial)

## Engine
Microsoft SQL Server

## ORM
Entity Framework Core

## Core Entities (Scaffold Phase)
- `Customer`
- `ServiceLocation`
- `Employee`
- `Equipment`
- `Vendor`
- `PartCategory`
- `Part`
- `JobTicket`
- `JobTicketEmployee`
- `TimeEntry`
- `TimeEntryAdjustment`
- `JobWorkEntry`
- `JobTicketPart`
- `JobTicketFile`
- `AuditLog`
- `InvoiceSummary`

## Design Notes
- Use `uniqueidentifier` for primary keys.
- Include `CreatedAtUtc` and `UpdatedAtUtc` for all auditable tables.
- Use soft delete (`IsDeleted`, `DeletedAtUtc`, `DeletedByUserId`) for mutable business records.
- Use lookup/reference tables for statuses and priorities where needed.
- Keep schema migration-first using EF Core migrations.
- Store all timestamps in UTC.
- Decimal precision conventions:
  - Money: `decimal(18,2)`
  - Quantity and labor hours: `decimal(18,4)`
  - Latitude/longitude: `decimal(9,6)`
- Relationship semantics:
  - `Customer` represents the requesting account for a job ticket.
  - `ServiceLocation` is the physical work site and includes company name, on-site contact data, address details, access instructions, and safety requirements.
  - `Billing Party` controls invoice responsibility and may differ from the requesting customer.
  - `Equipment Owner` may differ from the billing party.
  - `Equipment Responsible Billing Party` may differ from the equipment owner.
  - Service address and billing address are independent and must not be assumed equal.

## Connection Strategy
Use a standard SQL Server connection string via:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=JobTicketDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
}
```
