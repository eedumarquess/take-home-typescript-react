# FastMeals DDD Architecture

## Overview

The backend follows a layered DDD structure while keeping NestJS as the outer HTTP and composition shell.

```text
presentation -> application -> domain <- infrastructure
```

Dependency direction is strict:

- `domain` depends on no framework code
- `application` depends only on `domain`
- `presentation` depends on `application` and shared HTTP concerns
- `infrastructure` depends on `domain` ports and concrete libraries such as Prisma, JWT, and bcrypt

## Current Backend Layout

```text
backend/src
|- presentation/
|  |- controllers/
|  |- dto/
|  `- modules/
|- application/
|  |- auth/
|  |- delivery-persons/
|  |- optimization/
|  |- orders/
|  |- presenters/
|  `- reports/
|- domain/
|  |- auth/
|  |- delivery-persons/
|  |- optimization/
|  |- orders/
|  |- products/
|  |- reports/
|  |- shared/
|  `- users/
|- infrastructure/
|  |- auth/
|  |- optimization/
|  `- prisma/
|- common/
|- health/
|- prisma/
|- bootstrap/
|- app.module.ts
`- main.ts
```

## Layer Responsibilities

### Presentation

NestJS lives here and is intentionally treated as the transport boundary.

- controllers expose `/api/*` routes
- DTOs validate request bodies, params, and queries
- modules wire use cases to infrastructure adapters
- guards, decorators, filters, and pipes from `src/common` support the HTTP layer

Key route groups:

- `/api/auth`
- `/api/products`
- `/api/orders`
- `/api/delivery-persons`
- `/api/reports`
- `/api/health`

### Application

The application layer orchestrates business use cases without talking HTTP or SQL directly.

- use cases compose domain objects and repository ports
- presenter helpers shape domain outputs for API responses
- cross-aggregate workflows such as login, order creation, optimization, and reporting live here
- validation that is not transport-specific stays here when it represents application policy

Examples:

- `application/auth/auth.use-cases.ts`
- `application/orders/orders.use-cases.ts`
- `application/reports/reports.use-cases.ts`
- `application/optimization/optimization.use-case.ts`

### Domain

This is the business core. It contains entities, value objects, policies, and ports.

- order status transitions live in the order aggregate
- money is modeled as integer cents internally
- coordinates encapsulate distance calculations
- email and date-range rules are normalized here
- repository contracts and algorithm ports are defined here

Representative domain concerns:

- `domain/orders/order.ts`
- `domain/shared/money.ts`
- `domain/shared/coordinates.ts`
- `domain/shared/date-range.ts`
- `domain/auth/refresh-session.repository.ts`
- `domain/reports/analytics.repository.ts`

### Infrastructure

Infrastructure implements the ports defined by the domain and is the only place that knows about concrete technical details.

- Prisma repositories implement persistence
- JWT and bcrypt adapters implement auth concerns
- the Hungarian assignment adapter implements optimization
- SQL aggregation for reports stays here, not in controllers or use cases

Representative adapters:

- `infrastructure/prisma/prisma-order.repository.ts`
- `infrastructure/prisma/prisma-analytics.repository.ts`
- `infrastructure/prisma/prisma-refresh-session.repository.ts`
- `infrastructure/auth/jwt-token.service.ts`
- `infrastructure/optimization/hungarian-assignment.algorithm.ts`

## Business Invariants By Layer

### Domain invariants

- valid order status transitions
- monetary arithmetic in cents
- coordinate validity and distance calculations
- duplicate order item rejection
- normalized email semantics

### Application invariants

- create-order product validation plus insert must be transactional
- courier availability check plus assignment must be transactional
- refresh-token rotation must revoke and replace the session in one transaction
- stale concurrent order writes must fail through optimistic concurrency checks
- report filters must reject `startDate > endDate`

### Infrastructure guarantees

- PostgreSQL + Prisma persistence
- aggregated reports via `groupBy`, aggregate queries, and focused SQL
- persisted refresh sessions for rotation and revocation
- committed Prisma migrations as the supported schema delivery path

## Reporting Model

Reports are exposed under `/api/reports` and follow these semantics:

- revenue: delivered orders filtered by `deliveredAt`
- top products: delivered orders filtered by `deliveredAt`
- average delivery time: `createdAt -> deliveredAt`, excluding delivered orders without assigned courier
- orders by status: filtered by `createdAt`
- date-only filters are interpreted as Sao Paulo local day boundaries

Aggregation is pushed down into the infrastructure layer so the application layer receives already summarized data.

## NestJS Composition Model

NestJS modules remain the composition root. They bind:

- controller
- use cases
- repository implementations
- token services
- optimization algorithm adapter

This keeps framework code at the edge while preserving the expected Nest developer experience and testability.

## Why This Shape

This structure is intentional for the take-home:

- it satisfies the DDD decision already recorded for the repository
- it avoids turning NestJS itself into the domain model
- it keeps the HTTP contract stable while hardening the core workflows
- it makes high-risk logic testable without requiring database or controller coupling
