# Job Ticket Management System

Job Ticket Management System is an API-first platform for creating, assigning, executing, and reporting on field service job tickets. This repository is still in a **foundation/scaffold phase**, but it now includes substantial backend capabilities and architecture contracts.

## Completed Scope (Current State)

### Architecture and Repository Foundation
- Clean architecture backend separation is in place:
  - `Domain`: entities, enums, shared base types.
  - `Application`: service-layer use cases, DTO-oriented workflows.
  - `Infrastructure`: EF Core persistence, migrations, file storage provider abstraction.
  - `Api`: HTTP controllers, auth wiring, policy enforcement.
- React + TypeScript frontend scaffold is in place with modular folders for `api`, `components`, `features`, `pages`, and `routes`.
- Core project documentation exists for scope, API contracts, DB design, and developer setup.

### Implemented Backend Capabilities
- Health endpoint available at `GET /health`.
- Master data CRUD + archive flows for:
  - Customers
  - Service Locations
  - Equipment
  - Vendors
  - Part Categories
  - Parts
- Job ticket foundation workflows:
  - Create/list/get/update tickets
  - Status updates with completed-date conventions
  - Soft archive with required reason
  - Assignment add/remove/list with duplicate protections
  - Work entries (notes)
- Job ticket parts workflows:
  - Add/list/update parts used
  - Approve/reject/archive with audit-oriented behavior
  - Inventory adjustment flags and immutable pricing snapshots
- Time tracking workflows:
  - Clock-in/clock-out with GPS metadata
  - Open/by-job/by-employee queries
  - Manager approval/rejection/adjustment workflow
  - Adjustment history preservation for auditability
- Job ticket file workflows:
  - Upload/list/get/update/archive/download
  - SQL metadata persistence + pluggable storage provider abstraction
  - Local file storage provider implemented for current phase
- Reporting foundation endpoints:
  - Invoice-ready summary
  - Job cost summary
  - Jobs ready to invoice
  - Labor rollups (by job/by employee)
  - Parts rollups
  - Customer/equipment service history
- Authentication and authorization foundation:
  - Username/email + password login
  - JWT bearer token issuance and `GET /api/auth/me`
  - Role enforcement (`Admin`, `Manager`, `Employee`)
  - Admin-oriented user management endpoints

### Implemented Data & Persistence Foundation
- EF Core `ApplicationDbContext` + SQL Server integration.
- Initial and incremental migrations for:
  - Core model
  - Job workflow fields
  - Time tracking fields
  - Parts workflow fields
  - Service location/billing-party/equipment ownership fields
  - File upload fields
  - Reporting fields
  - Authentication and role enforcement fields
- Global soft-delete filtering behavior and auditing-oriented entities in place.

### Testing Foundation (Backend)
- Infrastructure test project includes coverage for:
  - DbContext and persistence behavior
  - Job tickets + job parts workflows
  - Job ticket file services
  - Time entry services
  - Master data services
  - Reporting services
  - Authentication integration

### Frontend Scope Status
- Employee-focused mobile workflow is implemented with React/Vite/TypeScript:
  - Login + JWT token session handling
  - Authenticated route protection
  - Assigned jobs list + job detail
  - Clock in/out with required browser GPS
  - Add work notes
  - Add parts used on assigned jobs
  - Upload photos/files (`jpg`, `jpeg`, `png`, `webp`, `pdf`)
- Manager/Admin UI screens remain out of scope for the current frontend phase.

## Tech Stack
- **Backend:** .NET 8 ASP.NET Core Web API
- **Frontend:** React + TypeScript (Vite)
- **Database:** Microsoft SQL Server
- **ORM:** Entity Framework Core

## Repository Structure

```text
/backend
  /src
    /Api
    /Application
    /Domain
    /Infrastructure
  /tests

/frontend
  /src
    /api
    /components
    /pages
    /routes
    /features

/docs
  project-scope.md
  database-design.md
  api-contract.md
  development-setup.md
```

## Documentation Index
- Project scope: [docs/project-scope.md](docs/project-scope.md)
- API contract: [docs/api-contract.md](docs/api-contract.md)
- Database design: [docs/database-design.md](docs/database-design.md)
- Development setup: [docs/development-setup.md](docs/development-setup.md)

## Development Environment
For full local setup instructions (tooling, Docker SQL Server, backend/frontend build commands, and troubleshooting), see [docs/development-setup.md](docs/development-setup.md).

## Backend Setup

```bash
cd backend/src/Api
cp appsettings.Example.json appsettings.Development.json
# update ConnectionStrings:DefaultConnection

# from backend/
dotnet restore
cd src/Api
dotnet build
dotnet run
```

API health endpoint:
- `GET /health`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Optional API base URL configuration:

```bash
# defaults to same-origin if not set
VITE_API_BASE_URL=http://localhost:5000
```

Employee workflow routes:
- `/login`
- `/jobs`
- `/jobs/:jobTicketId`

## Build & Test Instructions

### Backend
```bash
cd backend/src/Api
dotnet build
```

```bash
cd backend/src/Api
dotnet test ../../tests
```

### Frontend
```bash
cd frontend
npm run build
```
