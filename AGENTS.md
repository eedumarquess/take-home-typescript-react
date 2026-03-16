# AGENTS.md

## Project Context

This repository is a take-home challenge for a senior software engineer role.
The product is **FastMeals**, a food delivery admin platform with:

- A backend REST API in Node.js + TypeScript
- A frontend dashboard in React 18+ + TypeScript
- A PostgreSQL database

The current repository state is mostly documentation plus seed data. The implementation is expected to be created under `backend/` and `frontend/`.

Primary references:

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `docs/evaluation-criteria.md`
- `docs/DECISIONS.md`
- `seed/data.json`

## Current Decisions Already Recorded

The existing `docs/DECISIONS.md` records these initial choices:

- DDD-style architecture
- Prisma as ORM
- Biome configured

Important: the challenge requires a `DECISIONS.md` at the repository root for final delivery. If work continues, keep that file updated there even if `docs/DECISIONS.md` was the starting note.

## Non-Negotiable Technical Constraints

- Use TypeScript across backend and frontend.
- Keep `strict: true`.
- Do not use `any` unless there is an exceptional and well-justified reason.
- Backend must use JWT auth with access token expiry of `15m` and refresh token expiry of `7d`.
- Passwords must be hashed with bcrypt, at least 10 salt rounds.
- Protected routes must return `401` for invalid/expired tokens and `403` for insufficient permissions.
- Rate limiting is required: maximum `100 requests per minute per IP`.
- Input validation is required for body, params, and query values.
- Error responses must follow the standard `error.code`, `error.message`, `error.details` shape.
- Tests are mandatory.

Conservative interpretation for database choice:
- Use PostgreSQL.

## Domain Summary

There are two user roles:

- `admin`: full CRUD and operational actions
- `viewer`: read-only access to products, orders, and reports

Core domains:

- `users`
- `products`
- `orders`
- `order_items`
- `delivery_persons`

Main business goals:

- manage orders in real time
- manage products with full CRUD
- expose analytics and reports
- optimize order assignment to delivery persons

## Product Rules

Product fields include:

- `id`, `name`, `description`, `price`, `category`, `imageUrl`, `isAvailable`, `preparationTime`, `createdAt`, `updatedAt`

Rules:

- `name`: 3 to 120 chars
- `description`: 10 to 500 chars
- `price`: decimal > 0 with max 2 decimal places
- `category`: `meal | drink | dessert | side`
- `imageUrl`: optional valid URL
- `preparationTime`: integer from 1 to 120
- cannot delete a product linked to orders in `pending` or `preparing`
- unavailable products must stay visible in admin flows, but not in public-facing listings
- list endpoints must support pagination, name search, category filter, availability filter, and sorting

## Order Rules

Order fields include:

- customer identity and phone
- delivery address and coordinates
- items
- status
- total amount
- optional delivery person

Statuses:

- `pending`
- `preparing`
- `ready`
- `delivering`
- `delivered`
- `cancelled`

Valid transitions only:

- `pending -> preparing`
- `pending -> cancelled`
- `preparing -> ready`
- `preparing -> cancelled`
- `ready -> delivering` only when `deliveryPersonId` exists
- `ready -> cancelled`
- `delivering -> delivered`

Any other transition must return `422` with `INVALID_STATUS_TRANSITION`.

Other order rules:

- `totalAmount` is always calculated by the backend
- each `order_item` must snapshot `unitPrice` at order creation time
- new orders cannot include unavailable products
- order listing must support pagination, status filtering, and sorting

## Delivery Person Rules

Fields include:

- `name`
- `phone`
- `vehicleType`
- `isActive`
- `currentLatitude`
- `currentLongitude`

Constraints:

- `vehicleType`: `bicycle | motorcycle | car`
- inactive delivery persons cannot be assigned
- a delivery person already assigned to a `delivering` order is unavailable
- deletion should be blocked if the person is assigned to an in-progress delivery

## Analytics Requirements

The frontend must expose reports backed by the backend for:

- revenue by period
- orders grouped by status
- top 10 selling products, considering only `delivered`
- average delivery time

Report filters:

- support date range inputs where specified

Frontend expectations:

- at least two charts
- loading, error, and empty states
- responsive dashboard
- login flow with redirect
- token expiry handling that sends the user back to login

## Optimization Requirement

The key algorithmic feature is `POST /api/orders/optimize-assignment`.

Input source:

- all `ready` orders
- all active and available delivery persons

Output:

- optimized assignments
- unassigned orders if demand exceeds supply
- total distance

Rules:

- each delivery person can take at most one order
- distance must use the Haversine formula
- do not use brute force `O(n!)` for non-trivial sizes
- target is reasonable performance up to 50 orders and 30 delivery persons

Expected approach:

- Hungarian algorithm is explicitly suggested
- a well-documented heuristic is acceptable if tradeoffs and complexity are clear

## API Expectations

All routes are under `/api`.

Important route groups:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST /api/orders`
- `PATCH /api/orders/:id/status`
- `PATCH /api/orders/:id/assign`
- `POST /api/orders/optimize-assignment`
- `GET/POST/PUT/DELETE /api/delivery-persons`
- `GET /api/reports/revenue`
- `GET /api/reports/orders-by-status`
- `GET /api/reports/top-products`
- `GET /api/reports/average-delivery-time`

Use the exact error codes described in `docs/api-spec.md` where applicable.

## Database Guidance

Reference schema is in `docs/database-schema.md`.

Important modeling expectations:

- normalized data
- foreign keys and constraints
- indexes for filters, ordering, and reports
- `updated_at` should auto-update
- `orders.status + created_at` composite index is recommended
- coordinates should preserve precision

Recommended seed behavior:

- read from `seed/data.json`
- expose backend seed execution via `npm run seed`

## Seed Context

The seed file already includes:

- default users:
  - `admin@fastmeals.com / Admin@123`
  - `viewer@fastmeals.com / Viewer@123`
- products across `meal`, `drink`, `dessert`, and `side`
- active and inactive delivery persons
- sample orders in multiple statuses, including `ready`, `delivering`, `delivered`, and `cancelled`

The geographic sample data is centered around Sao Paulo and should be kept compatible with the optimization feature.

## Testing Bar

Minimum backend coverage required by the challenge:

- 2 auth tests
- 2 product CRUD tests
- 2 order status transition tests
- 2 optimization tests
- 2 report tests

Minimum frontend coverage required:

- 1 component render test
- 1 user interaction test
- 1 screen integration flow such as login
- total minimum: 5 frontend tests

Absence of tests is eliminatory.

## Delivery Expectations

Final project deliverables must include:

- complete source code
- `DECISIONS.md` at repository root
- `docker-compose.yml`
- clear run instructions for backend and frontend

Expected local ports from `.env.example`:

- backend: `3001`
- frontend API base URL: `http://localhost:3001/api`

## Guidance For Future Agents

- Read `docs/api-spec.md` before changing route contracts.
- Read `docs/database-schema.md` before altering persistence models.
- Keep behavior aligned with the explicit business rules above.
- Prefer PostgreSQL + Prisma unless there is a strong documented reason to change.
- When requirements conflict, choose the stricter interpretation and document it in `DECISIONS.md`.
- Treat compilation, tests, and runnable setup as first-class requirements, not cleanup work.
