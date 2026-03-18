# DECISIONS.md

## Current Repository Decisions

- Architecture style: DDD-inspired modular backend structure.
- ORM: Prisma.
- Linting and formatting: Biome.
- Database: PostgreSQL only.
- Backend stack wording: Node.js + TypeScript with backend framework of choice. This repository uses NestJS and treats it as fully acceptable.
- Auth contract: Bearer access token plus refresh-token rotation via `httpOnly` cookie.
- Roles: `admin` has operational access; `viewer` is read-only for products, orders, and reports only.
- Orders: `deliveredAt` and `order_status_events` are part of the reference model for delivery-time analytics and auditability.
- Optimization acceptance flow: the client applies a suggestion with `PATCH /api/orders/:id/assign` followed by `PATCH /api/orders/:id/status` with `status=delivering`.
- Backend composition root: `AppModule` wires global filter and guards, while domain modules own controllers/services/repositories.
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
- Local environment strategy: `docker-compose.yml` provisions PostgreSQL only; frontend and backend continue to run from the host with workspace scripts for faster iteration.
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

## Historical Note

This root file is the authoritative delivery artifact. Earlier bootstrap decisions have been folded into it.
