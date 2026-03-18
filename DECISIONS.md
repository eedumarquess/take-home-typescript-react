# DECISIONS.md

## Current Repository Decisions

- Architecture style: layered DDD backend structure with explicit `presentation -> application -> domain <- infrastructure` boundaries.
- ORM: Prisma.
- Linting and formatting: Biome.
- Database: PostgreSQL only.
- Backend stack wording: Node.js + TypeScript with backend framework of choice. This repository uses NestJS and treats it as fully acceptable.
- Auth contract: Bearer access token plus refresh-token rotation via `httpOnly` cookie.
- Roles: `admin` has operational access; `viewer` is read-only for products, orders, and reports only.
- Orders: `deliveredAt` and `order_status_events` are part of the reference model for delivery-time analytics and auditability.
- Optimization acceptance flow: the client applies a suggestion with `PATCH /api/orders/:id/assign` followed by `PATCH /api/orders/:id/status` with `status=delivering`.
- Backend composition root: `AppModule` wires global filter and guards, while feature modules in `src/presentation/modules` compose controllers, use cases and infrastructure adapters.
- Backend DDD implementation: NestJS is kept strictly as presentation/composition. Controllers live under `src/presentation`, use cases under `src/application`, aggregates/value objects/ports under `src/domain`, and Prisma/JWT/bcrypt/Hungarian adapters under `src/infrastructure`.
- Backend contract migration rule: the DDD refactor preserves the existing `/api` route contract, payload shapes, validation behavior, error format, JWT/refresh-cookie semantics, and RBAC/rate-limit behavior.
- Shared backend foundation: `src/common` centralizes DTOs, decorators, guards, filters, errors and reusable transforms before CRUD implementation begins.
- Auth implementation strategy for the challenge: JWT access token plus stateful refresh-token rotation backed by persisted refresh sessions keyed by `jti`.
- Frontend auth strategy: access token kept only in memory; session restoration depends on the refresh-token cookie and `/api/auth/refresh`.
- Frontend architecture: React Router app shell split into public and protected layouts, with feature-specific pages instead of a monolithic `App.tsx`.
- API validation strategy: global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted` and `transform`, with errors normalized to the required `error.code`, `error.message`, `error.details` shape.
- Error handling strategy: business-specific errors should use `AppException`; framework and Prisma errors are normalized by a global exception filter.
- Rate limiting strategy in Sprint 01: in-memory per-IP guard implementing `100 requests per minute per IP`. This is sufficient for the take-home and local Docker flow, but not meant as a multi-instance production strategy.
- Health check strategy: `/api/health` verifies Prisma reachability with a lightweight query instead of returning a static payload.
- Linting tradeoff in Sprint 01: Biome remains the single formatter/linter, but NestJS controller files are excluded from `biome check` because parameter decorators are unsupported and `unsafeParameterDecoratorsEnabled` is explicitly forbidden in this repository.
- Query conventions frozen in Sprint 01:
  - products: reusable pagination DTO plus `search`, `category`, `isAvailable`, `sortBy`, `sortOrder`
  - orders: reusable pagination DTO plus `status`, `startDate`, `endDate`, `sortBy`, `sortOrder`
  - reports: reusable date-range DTO for analytics endpoints
- Local environment strategy: the repository keeps the fast host-based workflow with workspace scripts, but the delivery artifact now also ships a full `docker compose up --build` path for `postgres + init + backend + frontend`.
- Frontend testing stack: Vitest + Testing Library.
- Backend testing strategy: Jest unit tests for services/guards plus Jest e2e tests for HTTP contracts that can run without a live database by overriding `PrismaService`.
- Prisma CLI configuration: seed/runtime CLI settings live in `backend/prisma.config.ts` instead of `package.json#prisma`, to stay aligned with the Prisma 7 migration path and remove current deprecation warnings.
- Refresh-token cookie scope: the cookie path is `/api/auth`, not `/api/auth/refresh`, so the same cookie can be used for both refresh rotation and server-side logout revocation.
- Sprint 02 security verification strategy: RBAC/auth/rate-limit HTTP coverage can use technical probe endpoints registered only in the e2e harness, avoiding premature public controllers before the domain sprints.
- Sprint 03 delivery-person coordinates: `currentLatitude` and `currentLongitude` are accepted only as a pair. Partial location updates are rejected as validation errors because a single coordinate is not operationally useful.
- Sprint 03 delivery-person availability filter: `GET /api/delivery-persons?available=false` is supported as the inverse of `available=true`, returning only couriers currently tied to `delivering` orders. This extends the required contract without breaking it.
- Sprint 04 order detail contract: `GET /api/orders/:id` stays identical to the list payload and does not expose `order_status_events` publicly yet. Status history remains persisted only for auditability and later reports.
- Sprint 04 orders UI: `/orders` uses the same split-view admin pattern as products and delivery persons, with list/filter controls on the left and create/detail/actions in the right-hand panel.
- Sprint 04 nested courier shape in orders: when an order has an assigned courier, the payload embeds only the operational summary `{ id, name, phone, vehicleType }` instead of the full delivery-person resource.
- Sprint 05 optimization algorithm: `POST /api/orders/optimize-assignment` uses the Hungarian algorithm over a padded square cost matrix built from Haversine distances. This keeps exact assignment quality with `O(n^3)` complexity and stays well inside the challenge target for up to 50 orders and 30 couriers.
- Sprint 05 optimization eligibility: the optimization input includes only `ready` orders plus couriers that are active, not already tied to a `delivering` order, and have both current coordinates filled. Couriers without coordinates are excluded from optimization suggestions rather than guessed or backfilled.
- Sprint 05 optimization semantics: the backend endpoint remains suggestion-only. Batch application is kept in the frontend by replaying the already accepted operational flow `assign -> delivering`, which avoids introducing a second write contract for assignment side effects.
- Sprint 05 analytics date semantics:
  - revenue, top-products and average-delivery-time are filtered by `deliveredAt` and only consider delivered orders
  - orders-by-status is filtered by `createdAt`, because it represents the distribution of persisted order states within the created-order period
- Sprint 05 reports implementation tradeoff: analytics are aggregated in application use cases from focused Prisma reads instead of raw SQL. This keeps the take-home easier to audit and test while still leveraging the required status/date indexes already present in the schema.
- Sprint 06 line endings policy: `.gitattributes` enforces LF for source and docs, while keeping Windows-native endings only for shell scripts that need them. This removes recurring Biome noise across environments.
- Sprint 06 container packaging: Docker delivery uses three runtime services plus one one-shot init job. `backend-init` runs `prisma db push` and `seed`, `backend` exposes the NestJS API, and `frontend` serves the Vite build through Nginx.
- Sprint 06 frontend delivery: the SPA is published behind an Nginx fallback so deep links from React Router keep working in the containerized runtime.

## Historical Note

This root file is the authoritative delivery artifact. Earlier bootstrap decisions have been folded into it.
