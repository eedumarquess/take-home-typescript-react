# FastMeals Take-Home

Monorepo TypeScript do painel administrativo FastMeals.

- `frontend/`: React 19 + Vite + React Router
- `backend/`: NestJS + Prisma + PostgreSQL
- `seed/`: dados iniciais do desafio
- `docs/`: especificacoes funcionais e tecnicas
- `DECISIONS.md`: log autoritativo das decisoes arquiteturais

## Estado do projeto

O Sprint 01 foi implementado com foco em fundacao e arquitetura:

- backend modularizado por dominio
- health check com validacao de conexao Prisma
- validacao global estrita e contrato unico de erro
- auth base com `login`, `refresh`, `logout`, access token Bearer e refresh token em cookie `httpOnly` com rotacao stateful
- rate limiting global `100 req/min` por IP
- frontend com shell autenticado, shell publico, roteamento e placeholders por modulo
- testes base para backend e frontend

## Requisitos

- Node.js 22+
- npm 10+
- Docker opcional para subir o PostgreSQL

## Variaveis de ambiente

Copie `.env.example` para `.env` na raiz.

```env
DATABASE_URL=postgresql://fastmeals:fastmeals123@localhost:5432/fastmeals
JWT_SECRET=sua-chave-secreta-aqui-trocar-em-producao
JWT_REFRESH_SECRET=sua-chave-refresh-aqui-trocar-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=100
COOKIE_SECURE=false
VITE_API_URL=http://localhost:3001/api
```

## Setup local

1. Instale as dependencias:

```bash
npm install
```

2. Suba o PostgreSQL:

```bash
docker compose up -d postgres
```

3. Gere o client Prisma e aplique o schema:

```bash
npm run prisma:generate --workspace backend
npm run db:push --workspace backend
```

4. Popule o banco:

```bash
npm run seed --workspace backend
```

## Desenvolvimento

Rodar frontend e backend juntos:

```bash
npm run dev
```

Rodar apenas um workspace:

```bash
npm run dev:frontend
npm run dev:backend
```

Portas padrao:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- API: `http://localhost:3001/api`
- health: `http://localhost:3001/api/health`

## Credenciais seed

- `admin@fastmeals.com / Admin@123`
- `viewer@fastmeals.com / Viewer@123`

## Scripts uteis

Na raiz:

```bash
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e:backend
```

No backend:

```bash
npm run prisma:generate
npm run db:push
npm run seed
npm run test
npm run test:e2e
```

No frontend:

```bash
npm run dev
npm run build
npm run test
```

## Estrutura arquitetural

### Backend

- `src/common`: validacao, erros, guards, decoradores e utilitarios transversais
- `src/health`: health check com Prisma
- `src/auth`: autenticacao inicial do painel
- `src/users`: acesso a usuarios para auth
- `src/products`, `src/orders`, `src/delivery-persons`, `src/reports`, `src/optimization`: boundaries preparados para os sprints seguintes

### Frontend

- `src/app`: providers e router
- `src/features/auth`: sessao, rotas protegidas e restauracao por refresh cookie
- `src/layouts`: shell publico e shell autenticado
- `src/pages`: dashboard e placeholders navegaveis dos modulos
- `src/services`: cliente HTTP com bearer token, cookies e retry via refresh

## Observacoes

- O frontend mantem o access token apenas em memoria e usa `POST /api/auth/refresh` para restaurar sessao.
- Refresh tokens sao rotacionados com persistencia server-side em PostgreSQL para invalidar reuse de cookies antigos.
- O backend falha cedo se o Prisma nao conseguir conectar ao banco durante a inicializacao.
- O rate limit desta sprint usa armazenamento em memoria, adequado para desenvolvimento local e para o escopo do take-home.
- O `biome check` exclui arquivos `*.controller.ts` do NestJS porque parameter decorators nao sao suportados pelo parser do Biome e a opcao proibida `unsafeParameterDecoratorsEnabled` nao e utilizada.

## Documentacao do desafio

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `docs/evaluation-criteria.md`
- `docs/scrum-plan/sprint-01-foundation-and-architecture.md`
