# Database Design

## Engine
Microsoft SQL Server

## ORM
Entity Framework Core

## Current Baseline
This document summarizes the implemented database shape for the current Job Ticket Management System baseline. It is descriptive documentation only; schema changes still require scoped EF Core migrations and roadmap approval.

The implemented model supports the protected job-ticket baseline, Manager/Admin workflows, reporting/time review, file uploads, parts request review, existing purchasing support, and inventory API foundation tables. Inventory remains hidden from Manager/Admin navigation until that workflow is completed and reintroduced.

This document does not approve purchasing expansion, receiving expansion, vendor invoice expansion, landed-cost expansion, warehouse/truck inventory expansion, replenishment, recommendation scoring, AI/ML, automatic compatibility decisions, or automatic approval.

## Schema Redesign Planning Boundary

Epic 0 of the schema redesign is in review. The proposed glossary, domain modules, invariants, relationship model, decision register, and worked examples are maintained in [Schema Redesign Domain Contract](./schema-redesign-domain-contract.md).

The entities and relationships below describe the implemented baseline. Target terms such as `EquipmentConfiguration`, `EquipmentAsset`, `EquipmentPartFitment`, `VendorPart`, and `EmployeeCompensationRate` are not implemented database objects. No migration, backfill, field removal, or endpoint change is approved until the domain contract's pending decisions and approval checklist are complete.

## Core Entities
- `Customer`
- `ServiceLocation`
- `Employee`
- `Equipment`
- `Vendor`
- `PartCategory`
- `Part`
- `PurchaseOrder`
- `PurchaseOrderLine`
- `StockLocation`
- `InventoryTransaction`
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

## Parts Compatibility Data Capture
- Data model changes are focused on collecting historical compatibility signals for visibility and later analysis, not generating recommendations.
- `Equipment` includes optional structured attributes for `Manufacturer`, `ModelNumber`, `SerialNumber`, `EquipmentType`, `UnitNumber`, and `Year`.
- `JobTicketPart` includes optional compatibility context fields:
  - `EquipmentId` (nullable FK to `Equipment`)
  - `ComponentCategory`
  - `FailureDescription`
  - `RepairDescription`
  - `TechnicianNotes`
  - `InstalledAtUtc`
  - `WasSuccessful`
  - `RemovedAtUtc`
  - `ReplacedByJobTicketPartId` (nullable self-reference FK)
  - `CompatibilityNotes`
- Added indexes support historical lookup and analysis:
  - `Equipment`: `Manufacturer`, `ModelNumber`, `SerialNumber`
  - `JobTicketPart`: `EquipmentId`, `ComponentCategory`, `WasSuccessful`, `InstalledAtUtc`
- Allowed wording for current product behavior is cautious: previously used, commonly used, technician-confirmed, possible match based on similar jobs, or needs verification.
- Recommendation logic, scoring, AI/ML inference, suggestion APIs, guaranteed compatibility claims, automatic compatibility decisions, and automatic approval remain deferred until explicitly approved in the roadmap and scope docs.
