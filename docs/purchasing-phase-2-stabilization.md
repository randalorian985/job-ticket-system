# Purchasing Phase 2 Stabilization Checklist

## Purpose
This document captures the bounded stabilization expectations for the merged purchasing records workflow before any advanced inventory or recommendation scope is introduced.

## Stabilization Boundaries
The current purchasing phase remains limited to:
- Purchase-order records and line items.
- Receiving quantity validation against existing purchase-order lines.
- Vendor invoice and landed-cost recording.
- Manager/Admin-only purchasing workflows.
- DTO-driven API contracts and application-service business logic.

The following remain explicitly deferred:
- Warehouse or truck inventory workflows.
- Inventory transaction ledgers.
- Automated replenishment.
- Recommendation or AI/scoring logic.
- Authorization model changes.

## Merge-Readiness Validation
Before additional purchasing changes merge into `main`, validate:
1. Purchase-order numbers remain unique.
2. Duplicate part lines are rejected during create/update flows.
3. Receiving quantities do not bypass existing purchase-order validation rules.
4. Archive and unarchive flows preserve soft-delete semantics.
5. Controllers remain thin and delegate business rules to application services.
6. Existing enum numbering and Manager/Admin authorization policies remain unchanged.

## Standard Validation Commands
```bash
dotnet restore backend/JobTicketSystem.sln
dotnet build backend/JobTicketSystem.sln
dotnet test backend/JobTicketSystem.sln
cd frontend && npm install
cd frontend && npm run build
cd frontend && npm test
```
