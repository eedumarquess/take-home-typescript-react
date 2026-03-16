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

## Historical Note

This root file is the authoritative delivery artifact. Earlier bootstrap decisions have been folded into it.
