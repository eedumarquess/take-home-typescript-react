# FastMeals Take-Home

Monorepo TypeScript do painel administrativo FastMeals, pronto para submissao do take-home com backend NestJS, frontend React e persistencia em PostgreSQL.

- `frontend/`: React 19 + Vite + React Router
- `backend/`: NestJS + Prisma + PostgreSQL
- `seed/`: dados iniciais do desafio
- `docs/`: especificacoes funcionais e tecnicas
- `DECISIONS.md`: log autoritativo das decisoes arquiteturais

## Escopo entregue

- autenticacao JWT com access token `15m`, refresh token rotativo `7d` via cookie `httpOnly`
- RBAC com perfis `admin` e `viewer`
- CRUD operacional de produtos e entregadores
- criacao, listagem, atribuicao e transicoes de pedidos
- optimize-assignment com Hungarian algorithm e distancia Haversine
- relatorios de receita, status, top produtos e tempo medio de entrega
- frontend responsivo com login, shell autenticado, estados de loading/erro/vazio e expiracao de sessao
- suite de testes unitarios, integracao HTTP, e2e backend e testes de UI

## Requisitos

- Node.js 22+
- npm 10+
- Docker Desktop opcional para o fluxo conteinerizado completo

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

## Execucao local

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

5. Rode frontend e backend:

```bash
npm run dev
```

Portas padrao:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- API: `http://localhost:3001/api`
- health: `http://localhost:3001/api/health`

Para rodar apenas um workspace:

```bash
npm run dev:frontend
npm run dev:backend
```

## Fluxo Docker unico

O compose da raiz agora sobe `postgres`, inicializa schema + seed e publica backend e frontend com um unico comando:

```bash
docker compose up --build
```

Servicos publicados:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- postgres: `localhost:5432`

Observacoes do compose:

- `backend-init` executa `prisma db push` e `seed` antes da API subir
- o frontend e servido por Nginx com fallback de rota para a SPA
- o build do frontend fixa `VITE_API_URL=http://localhost:3001/api`, alinhado ao caso
- o ambiente Docker usa segredos locais de desenvolvimento e `COOKIE_SECURE=false`

## Credenciais seed

- `admin@fastmeals.com / Admin@123`
- `viewer@fastmeals.com / Viewer@123`

## Scripts uteis

Na raiz:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:e2e:backend
```

No backend:

```bash
npm run prisma:generate --workspace backend
npm run db:push --workspace backend
npm run seed --workspace backend
npm run test --workspace backend
npm run test:e2e --workspace backend
```

No frontend:

```bash
npm run dev --workspace frontend
npm run build --workspace frontend
npm run test --workspace frontend
```

## Validacao

Checklist automatizado do monorepo:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:e2e:backend
```

Smoke manual minimo recomendado:

- login com `admin` e navegacao por produtos, pedidos, entregadores e relatorios
- login com `viewer` confirmando bloqueio de escrita e modulo de entregadores
- criacao de pedido, atribuicao de entregador e transicao de status
- execucao de `optimize-assignment`
- expiracao ou limpeza de sessao retornando o usuario para `/login`

## Checklist de submissao

- `DECISIONS.md` atualizado com auth, analytics, optimization, packaging e hardening
- `docker-compose.yml` com `backend + frontend + postgres`
- `backend/README.md` e `frontend/README.md` com setup e run por workspace
- `seed/data.json` com credenciais e massa operacional do desafio
- `docs/api-spec.md` e `docs/database-schema.md` preservados como referencia contratual

## Estrutura arquitetural

### Backend

- `src/common`: validacao, erros, guards, decoradores e utilitarios transversais
- `src/health`: health check com Prisma
- `src/auth`: login, refresh rotativo e logout
- `src/users`: acesso a usuarios para auth
- `src/products`, `src/orders`, `src/delivery-persons`, `src/reports`, `src/optimization`: modulos operacionais do caso

### Frontend

- `src/app`: providers e router
- `src/features/auth`: sessao, rotas protegidas e restauracao por refresh cookie
- `src/layouts`: shell publico e shell autenticado
- `src/pages`: dashboard, produtos, pedidos, entregadores, relatorios e login
- `src/services`: cliente HTTP com bearer token, cookies e retry via refresh

## Observacoes

- O frontend mantem o access token apenas em memoria e usa `POST /api/auth/refresh` para restaurar sessao.
- Refresh tokens usam cookie `httpOnly` com `Path=/api/auth`, permitindo refresh e logout no mesmo escopo.
- Refresh tokens sao rotacionados com persistencia server-side em PostgreSQL para invalidar reuse de cookies antigos.
- O backend falha cedo se o Prisma nao conseguir conectar ao banco durante a inicializacao.
- O rate limit usa armazenamento em memoria, adequado para desenvolvimento local e para o escopo do take-home.
- O repositorio fixa line endings com `.gitattributes` para manter LF em codigo e docs.
- O `biome check` exclui arquivos `*.controller.ts` do NestJS porque parameter decorators nao sao suportados pelo parser do Biome e a opcao proibida `unsafeParameterDecoratorsEnabled` nao e utilizada.

## Documentacao do desafio

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `docs/evaluation-criteria.md`
- `docs/scrum-plan/`
