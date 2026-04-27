# Job Ticket Management System

Initial project scaffold for a Job Ticket Management System.

## Tech Stack
- **Backend:** .NET 8 ASP.NET Core Web API
- **Frontend:** React + TypeScript
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
```

## Development Environment

For full local setup instructions (tooling, Docker SQL Server, backend/frontend build commands, and troubleshooting), see [docs/development-setup.md](docs/development-setup.md).

## Backend Setup

```bash
cd backend/src/Api
cp appsettings.Example.json appsettings.Development.json
# update ConnectionStrings:DefaultConnection

dotnet restore
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

```bash
cd frontend
npm test
```

## Notes
- This is a foundation-only scaffold.
- Business domain logic, authentication, and ticket workflows are intentionally not implemented yet.


## Authentication and Authorization

- API authentication uses JWT bearer tokens (`/api/auth/login`).
- Configure `Jwt:Issuer`, `Jwt:Audience`, `Jwt:SigningKey`, and `Jwt:ExpirationMinutes` in `backend/src/Api/appsettings.json` (or environment variables).
- Roles: `Admin`, `Manager`, `Employee`.
- First admin bootstrap: create an employee via `/api/users` as `Admin` (or seed directly in DB with `UserName`, `Role`, and hashed `PasswordHash`).
- Current user endpoint: `GET /api/auth/me`.
