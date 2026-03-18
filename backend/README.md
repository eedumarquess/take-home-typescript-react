# Backend FastMeals

API REST do painel administrativo FastMeals em NestJS + Prisma + PostgreSQL.

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+ acessivel pela `DATABASE_URL`

## Variaveis de ambiente

O backend le variaveis a partir da raiz do monorepo. O caminho esperado em desenvolvimento local e `.env` na raiz.

Campos obrigatorios:

```env
DATABASE_URL=postgresql://fastmeals:fastmeals123@localhost:5432/fastmeals
JWT_SECRET=trocar-em-producao
JWT_REFRESH_SECRET=trocar-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=100
COOKIE_SECURE=false
```

## Setup

1. Instale dependencias na raiz:

```bash
npm install
```

2. Gere o client Prisma:

```bash
npm run prisma:generate --workspace backend
```

3. Aplique o schema:

```bash
npm run db:push --workspace backend
```

4. Popule o banco com a massa do desafio:

```bash
npm run seed --workspace backend
```

## Execucao

Desenvolvimento:

```bash
npm run start:dev --workspace backend
```

Build e runtime:

```bash
npm run build --workspace backend
npm run start:prod --workspace backend
```

API publicada em `http://localhost:3001/api`.

## Scripts uteis

```bash
npm run prisma:generate --workspace backend
npm run db:push --workspace backend
npm run seed --workspace backend
npm run test --workspace backend
npm run test:e2e --workspace backend
npm run lint --workspace backend
npm run typecheck --workspace backend
```

## Testes

- unitarios com Jest para services e guards
- e2e HTTP com Jest em `backend/test/`
- contratos principais cobertos para auth, produtos, pedidos, optimization e reports

## Docker

O `docker-compose.yml` da raiz usa o `backend/Dockerfile` com dois alvos:

- `tooling`: aplica `db push` e `seed`
- `runtime`: publica a API em producao

Subida completa a partir da raiz:

```bash
docker compose up --build
```
