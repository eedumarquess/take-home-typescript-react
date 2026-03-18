# Sprint 01 - Foundation and Architecture

## Sprint Goal

Estabelecer a base tecnica executavel do FastMeals e congelar as decisoes estruturais que habilitam os modulos de negocio, os contratos REST e o dashboard administrativo.

## Status

Esta sprint deve ser lida como a fundacao ja consolidada no repositorio atual. A versao anterior do documento estava desatualizada porque tratava como backlog itens que ja foram implementados no codigo, como health check, base de autenticacao, shell de navegacao e convencoes globais da API.

## Scope of Sprint 01

O escopo correto desta sprint e definir e entregar a infraestrutura compartilhada do projeto. Isso inclui:

- workspace raiz com scripts de desenvolvimento, build, lint e typecheck
- backend NestJS com prefixo global `/api`, carregamento de configuracao, `PrismaModule` e health check real
- schema Prisma para PostgreSQL alinhado ao modelo de referencia, incluindo `order_status_events`, `delivered_at` e sessoes de refresh token
- seed executavel a partir de `seed/data.json`
- convencoes globais de validacao e erro no backend
- app shell frontend com React Router, layouts publico/protegido e camada HTTP
- base de autenticacao necessaria para sustentar navegacao protegida e restauracao de sessao
- documentacao operacional inicial em `README.md`, `.env.example`, `docker-compose.yml` e `DECISIONS.md`

Itens de negocio completos, como CRUDs finais, fluxo operacional de pedidos, relatorios e algoritmo de otimizacao, pertencem aos sprints seguintes, mesmo que os modulos e placeholders ja existam.

## Repository Baseline Confirmed

O estado atual do repositorio confirma a entrega da fundacao:

- root workspace com scripts para `dev`, `build`, `typecheck`, `lint` e `format`
- backend em NestJS sob `backend/src` com `AppModule`, `PrismaModule`, `ConfigModule`, prefixo `/api` e health check em `/api/health`
- `ValidationPipe` global e filtro global de excecao ja conectados no bootstrap
- auth base implementada com `login`, `refresh`, `logout`, access token Bearer e refresh token rotativo em cookie `httpOnly`
- schema Prisma modelado para `users`, `products`, `orders`, `order_items`, `delivery_persons`, `order_status_events` e `refresh_sessions`
- seed Prisma conectado a `seed/data.json`
- frontend React + Vite com React Router, `PublicShell`, `AppShell`, `ProtectedRoute` e restauracao de sessao via refresh cookie
- cliente HTTP frontend preparado para bearer token, envio de cookies e retry via refresh
- `DECISIONS.md` atualizado como log autoritativo da arquitetura adotada

## Sprint Stories

- `[Platform]` Consolidar o ambiente local com PostgreSQL, `.env`, scripts de workspace e fluxo reproduzivel de bootstrap.
- `[Backend]` Congelar a arquitetura modular e as convencoes transversais antes da implementacao completa dos dominios.
- `[Backend]` Entregar a base de seguranca necessaria para guards, sessao, erros padronizados e rate limiting.
- `[Frontend]` Evoluir do bootstrap inicial para um app shell com roteamento, layouts separados e areas protegidas.
- `[Docs/DevOps]` Fechar a documentacao operacional e o registro de decisoes tecnicas da fundacao.

## Execution Stages

### Stage 1 - Environment and bootstrap

Objetivo: garantir setup local coerente e repetivel.

Checklist:

- [x] Validar workspace raiz com `frontend` e `backend`
- [x] Alinhar `.env.example` com as variaveis consumidas por NestJS, Prisma e Vite
- [x] Fixar backend na porta `3001` e frontend usando `http://localhost:3001/api`
- [x] Provisionar PostgreSQL via `docker-compose.yml`
- [x] Conectar Prisma com `generate`, `db push` e `seed`
- [x] Expor health check em `/api/health` com verificacao de conectividade
- [x] Manter scripts de baseline para `dev`, `build`, `typecheck` e `lint`

### Stage 2 - Backend architecture

Objetivo: congelar a estrutura do backend antes dos casos de uso de negocio.

Checklist:

- [x] Definir modulos raiz para `auth`, `users`, `products`, `orders`, `delivery-persons`, `reports`, `optimization` e `health`
- [x] Centralizar concernes compartilhados em `src/common`
- [x] Separar responsabilidades entre controllers, services e repositories
- [x] Isolar acesso ao banco via `PrismaModule` e repositories dedicados
- [x] Congelar enums, DTOs base e contratos de query reutilizaveis
- [x] Preparar decoradores, guards e utilitarios para RBAC e autenticacao
- [x] Alinhar boundaries com `docs/api-spec.md` e `docs/database-schema.md`

### Stage 3 - Cross-cutting API conventions

Objetivo: fechar o comportamento compartilhado da API.

Checklist:

- [x] Configurar validacao global estrita para body, params e query
- [x] Padronizar respostas de erro em `error.code`, `error.message`, `error.details`
- [x] Normalizar erros de validacao, autenticacao, autorizacao e regras de negocio
- [x] Definir base para `401`, `403`, `404`, `409`, `422` e `429`
- [x] Implementar rate limiting local de `100 requests por minuto por IP`
- [x] Fixar expiracao de JWT com access token `15m` e refresh token `7d`
- [x] Congelar convencoes de paginacao, filtros e sorting para modulos futuros
- [x] Preparar base de testes unitarios e e2e do backend

### Stage 4 - Frontend app shell

Objetivo: sair de um bootstrap isolado para uma aplicacao navegavel e protegida.

Checklist:

- [x] Instalar e configurar React Router
- [x] Separar layouts publico e autenticado
- [x] Criar `ProtectedRoute` e restauracao de sessao por refresh
- [x] Definir camada HTTP com bearer token, cookies e tratamento padrao de `401`
- [x] Criar placeholders navegaveis para `dashboard`, `products`, `orders`, `delivery-persons` e `reports`
- [x] Garantir shell responsivo base para desktop e mobile
- [x] Cobrir o fluxo basico de roteamento e login com testes iniciais

### Stage 5 - Operational docs and delivery baseline

Objetivo: fechar a sprint com artefatos que sustentem os proximos sprints.

Checklist:

- [x] Criar `docker-compose.yml` para PostgreSQL local
- [x] Revisar `README.md` com setup real, seed e execucao
- [x] Atualizar `DECISIONS.md` com as decisoes da fundacao
- [x] Registrar tradeoffs de arquitetura backend/frontend
- [x] Manter scripts necessarios para execucao local e verificacao

## Delivered Outcomes

- base backend/frontend executavel em TypeScript com `strict: true`
- arquitetura modular definida e refletida no codigo
- fundacao de auth, sessao e navegacao protegida pronta para ser consumida pelos dominios
- persistencia PostgreSQL via Prisma com seed e modelo alinhado ao desafio
- convencoes de API, erro, validacao e rate limiting estabelecidas
- documentacao operacional inicial coerente com o estado do repositorio

## Explicit Non-Goals of Sprint 01

Os itens abaixo nao sao criterio de conclusao desta sprint:

- CRUD completo de produtos
- CRUD completo de entregadores
- fluxo completo de pedidos e maquina de estados
- implementacao final do algoritmo `POST /api/orders/optimize-assignment`
- endpoints finais de relatorios
- telas finais de operacao com dados reais

Esses itens dependem da fundacao desta sprint, mas pertencem aos sprints seguintes.

## Dependencies

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `DECISIONS.md`
- PostgreSQL local ou via Docker

## Acceptance Criteria

- backend, frontend e banco sobem com configuracao coerente e reproduzivel
- a fundacao tecnica refletida no codigo bate com a documentacao operacional
- a arquitetura modular backend/frontend esta definida antes da implementacao completa dos dominios
- a API possui convencoes compartilhadas claras para validacao, erros, autenticacao e rate limiting
- o frontend possui shell navegavel com layouts publico e protegido
- `README.md`, `.env.example`, `docker-compose.yml` e `DECISIONS.md` refletem a base adotada
- os proximos sprints podem focar em regras de negocio sem rediscutir a fundacao
