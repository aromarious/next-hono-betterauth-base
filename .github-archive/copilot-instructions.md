# Copilot Instructions - WebService-Next-Hono-Base

## Project Overview

This is a **contract-first** web service development base using Next.js + Hono + OpenAPI + Better Auth + Drizzle + PostgreSQL. The architecture emphasizes OpenAPI as the single source of truth for client-server contracts.

## Architecture Principles

### 1. Contract-First Development
- OpenAPI specification in `packages/shared-openapi/` drives all type generation
- Run `pnpm openapi:gen` to generate types for both client and server
- API changes must update OpenAPI spec first, then implementation

### 2. Layered Architecture (Clean Architecture)
```
domain/           # Pure business logic, no dependencies
application/      # Use cases, orchestrates domain + infrastructure  
infrastructure/   # Database, external APIs, framework adapters
```

### 3. Thin API Layer (Hono)
- API routes in `apps/api/` handle only:
  - Zod validation (auto-generated from OpenAPI)
  - Session authentication
  - Delegating to application layer
- Keep business logic OUT of API handlers

## Directory Structure (When Implemented)

```
apps/
  web/              # Next.js App Router frontend
  api/              # Hono API server
packages/
  domain/           # Business entities and rules
  application/      # Use cases and services
  infrastructure/   # DB access, external services
  shared-openapi/   # OpenAPI spec + generated types
  shared-config/    # Shared tooling configs
ops/
  db/              # Drizzle schemas and migrations
dev/               # Development tooling configs (NOT runtime code)
  eslint/          # ESLint configurations
  tsconfig/        # TypeScript base configs
  tailwind/        # Tailwind theme configs
  codegen/         # Code generation scripts
```

## Key Development Workflows

### Initial Setup
```bash
pnpm install
pnpm db:push          # Apply Drizzle migrations
pnpm openapi:gen      # Generate types from OpenAPI
```

### Development Loop
```bash
pnpm dev:api          # Start Hono API (localhost:8787)
pnpm dev:web          # Start Next.js (localhost:3000)
```

### After OpenAPI Changes
```bash
pnpm openapi:gen      # Regenerate types
# Update implementations to match new contracts
```

## Authentication Pattern (Better Auth)

- Session-based authentication using Better Auth
- Database adapter via Drizzle
- Session middleware in Hono validates authentication
- Protected routes should check session in middleware, not in handlers

## Database Patterns (Drizzle + PostgreSQL)

- Schema definitions in `ops/db/schema/`
- Migrations managed by `drizzle-kit`
- Repository pattern in `packages/infrastructure/`
- Use `pnpm db:generate` and `pnpm db:push` for schema changes

## Code Generation Dependencies

This project heavily relies on code generation:

1. **OpenAPI → Types**: `openapi-typescript` generates request/response types
2. **OpenAPI → Zod**: `openapi-zod-client` generates validation schemas
3. **Database → Types**: `drizzle-kit` generates database types

Always regenerate after spec changes to maintain type safety.

## Configuration Management

- Development configs centralized in `dev/` folder
- Apps extend base configs: `"extends": "../../dev/tsconfig/base.json"`
- Secrets managed externally (Vault/1Password CLI), never commit `.env`
- Use environment variable injection for secrets

## API Versioning Strategy

- Breaking changes require new API version (e.g., `/v2/`)
- Maintain backward compatibility when possible
- Update OpenAPI spec version number for tracking

## Testing Approach

- Contract testing against OpenAPI specification
- Integration tests for application layer use cases
- E2E tests for critical user journeys (login, core features)

## When Adding New Features

1. Define API contract in OpenAPI spec first
2. Generate types: `pnpm openapi:gen`
3. Implement domain logic in `packages/domain/`
4. Add use case in `packages/application/`
5. Create repository/adapter in `packages/infrastructure/`
6. Wire up Hono route handler (thin layer)
7. Add Next.js UI components

## Common Pitfalls to Avoid

- Don't put business logic in API route handlers
- Always regenerate types after OpenAPI changes
- Don't bypass authentication middleware for protected routes
- Keep `dev/` folder for tooling only, no runtime code