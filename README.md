# FastMeals Take-Home

Monorepo TypeScript do painel administrativo FastMeals, pronto para submissao do take-home com backend NestJS, frontend React e persistencia em PostgreSQL.

- `frontend/`: React 19 + Vite + React Router + TanStack Query
- `backend/`: NestJS + Prisma + PostgreSQL
- `seed/`: dados iniciais do desafio
- `docs/`: especificacoes funcionais e tecnicas
- `DECISIONS.md`: log autoritativo das decisoes arquiteturais

## Escopo entregue

- autenticacao JWT com access token `15m`, refresh token rotativo `7d` via cookie `httpOnly`
- RBAC com perfis `admin` e `viewer`
- CRUD operacional de produtos e entregadores
- criacao, listagem, atribuicao e transicoes de pedidos com endurecimento de concorrencia
- `PATCH /api/products/:id` como contrato principal de edicao e `PATCH /api/products/:id/availability` para toggle dedicado
- `optimize-assignment` com Hungarian algorithm, distancia Haversine, cap de `10 km` e desempate deterministico
- relatorios de receita, status, top produtos e tempo medio de entrega agregados no banco
- frontend responsivo com dashboard vivo, polling de pedidos, estados de loading/erro/vazio e expiracao de sessao
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

3. Gere o client Prisma e aplique as migrations:

```bash
npm run prisma:generate --workspace backend
npm run db:migrate:deploy --workspace backend
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

Para criar novas migrations de desenvolvimento:

```bash
npm run db:migrate:dev --workspace backend -- --name nome_da_migration
```

## Fluxo Docker unico

O compose da raiz sobe `postgres`, aplica migrations, executa seed e publica backend e frontend com um unico comando:

```bash
docker compose up --build
```

Servicos publicados:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- postgres: `localhost:5432`

Observacoes do compose:

- `backend-init` executa `prisma migrate deploy` e `seed` antes da API subir
- o frontend e servido por Nginx com fallback de rota para a SPA
- o build do frontend fixa `VITE_API_URL=http://localhost:3001/api`, alinhado ao caso
- o ambiente Docker usa segredos locais de desenvolvimento e `COOKIE_SECURE=false`

## Credenciais seed

- `admin@fastmeals.com / Admin@123`
- `viewer@fastmeals.com / Viewer@123`

## API e comportamento operacional

- `PATCH /api/products/:id` e o contrato principal para edicao parcial de produto
- `PUT /api/products/:id` continua disponivel como alias de compatibilidade
- `PATCH /api/products/:id/availability` isola o toggle de disponibilidade
- listagens e relatorios tratam `startDate` e `endDate` em janelas locais de Sao Paulo
- a tela de pedidos faz polling a cada 30 segundos enquanto a aba esta visivel
- o dashboard usa os endpoints de relatorio para exibir metricas operacionais ao vivo

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
npm run db:migrate:deploy --workspace backend
npm run db:migrate:status --workspace backend
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
- login com `viewer` confirmando redirecionamento fora de `/delivery-persons`
- criacao de pedido, atribuicao de entregador e transicao de status
- execucao de `optimize-assignment`
- expiracao ou limpeza de sessao retornando o usuario para `/login`

## Checklist de submissao

- `DECISIONS.md` atualizado com auth, analytics, optimization, packaging e hardening
- `docker-compose.yml` com `postgres + backend-init + backend + frontend`
- pipeline em `.github/workflows/ci.yml`
- migrations Prisma versionadas em `backend/prisma/migrations`
- `seed/data.json` com credenciais e massa operacional do desafio
- `docs/api-spec.md` e `docs/database-schema.md` preservados como referencia contratual

## Estrutura arquitetural

### Backend

- `src/presentation`: modulos Nest, controllers e DTOs HTTP
- `src/application`: use cases e orquestracao de regras
- `src/domain`: agregados, value objects, politicas e portas
- `src/infrastructure`: Prisma, JWT, bcrypt e algoritmo de otimizacao
- `src/common`: validacao, guards, erros, decoradores e utilitarios transversais

### Frontend

- `src/app`: providers e router
- `src/features/auth`: sessao, rotas protegidas e restauracao por refresh cookie
- `src/pages`: dashboard, produtos, pedidos, entregadores, relatorios e login
- `src/services`: cliente HTTP, tratamento de erro e utilitarios compartilhados

## Observacoes

- O frontend mantem o access token apenas em memoria e usa `POST /api/auth/refresh` para restaurar sessao.
- Refresh tokens usam cookie `httpOnly` com `Path=/api/auth`, permitindo refresh e logout no mesmo escopo.
- Refresh tokens sao rotacionados de forma transacional com persistencia server-side em PostgreSQL para invalidar reuse de cookies antigos.
- O backend usa inteiro em centavos internamente para calculos monetarios e converte apenas nas bordas.
- O backend falha cedo se o Prisma nao conseguir conectar ao banco durante a inicializacao.
- O rate limit usa armazenamento em memoria, adequado para desenvolvimento local e para o escopo do take-home.
- O repositorio fixa line endings com `.gitattributes` para manter LF em codigo e docs.
- O `biome check` exclui arquivos `*.controller.ts` do NestJS porque parameter decorators nao sao suportados pelo parser do Biome e a opcao proibida `unsafeParameterDecoratorsEnabled` nao e utilizada.

## Documentacao do desafio

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `docs/evaluation-criteria.md`
- `docs/ddd-architecture.md`
- `docs/scrum-plan/`
