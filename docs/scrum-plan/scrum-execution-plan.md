# FastMeals Scrum Execution Plan

## System Overview

FastMeals e uma plataforma administrativa fullstack para operacao de delivery, composta por uma API REST em NestJS + TypeScript, um dashboard em React + TypeScript e persistencia em PostgreSQL via Prisma.

O repositorio atual ja possui um bootstrap parcial que acelera a execucao do desafio:

- NestJS com `ConfigModule`, prefixo global `/api` e health check
- Prisma com schema PostgreSQL alinhado ao modelo de referencia
- Seed baseado em `seed/data.json`
- Frontend React + Vite com leitura de variaveis da raiz
- Scripts de workspace para desenvolvimento, build, lint e typecheck

O trabalho restante esta concentrado na implementacao dos modulos de negocio, autenticacao, interfaces do dashboard, testes obrigatorios e empacotamento final de entrega.

## Main Development Domains

- `platform foundation`: scripts, ambiente, Docker, fluxo de execucao local e convencoes compartilhadas
- `backend architecture`: estrutura modular DDD-inspired, validacao, auth, RBAC, rate limiting e tratamento padrao de erros
- `data layer`: schema Prisma, indices, seed, consistencia transacional e auditoria de status
- `core business services`: produtos, entregadores, pedidos, regras de atribuicao e maquina de estados
- `api surface`: contratos REST sob `/api`, paginacao, filtros, ordenacao e codigos de erro
- `frontend application`: login, layout protegido, telas operacionais, dashboard responsivo e estados de UX
- `quality and delivery`: testes, verificacao de performance, README, `DECISIONS.md` e `docker-compose.yml`

## Product Backlog

1. Foundation and architecture
2. Auth and security
3. Products CRUD
4. Delivery persons CRUD
5. Orders lifecycle
6. Optimize assignment
7. Reports and analytics
8. Frontend auth and protected navigation
9. Operational frontend screens
10. Testing, Docker and docs

## Sprint Plan

### Sprint 01

- Goal: estabelecer a base de execucao e congelar a arquitetura tecnica do projeto
- Focus: setup do monorepo, organizacao modular, app shell e convencoes compartilhadas
- Deliverables: estrutura de modulos backend/frontend, shell navegavel, base Docker/env e criterios arquiteturais documentados
- Dependencies: baseline atual do repositorio

### Sprint 02

- Goal: tornar autenticacao e seguranca utilizaveis ponta a ponta
- Focus: login, refresh token rotativo, RBAC, rate limiting e infraestrutura de validacao
- Deliverables: fluxo completo de autenticacao entre frontend e backend, guards reutilizaveis e cobertura inicial de testes de seguranca
- Dependencies: Sprint 01

### Sprint 03

- Goal: entregar os dominios CRUD de catalogo e frota
- Focus: produtos e entregadores com contratos REST estaveis e telas administrativas
- Deliverables: APIs de produtos/entregadores com filtros e regras de conflito, mais interfaces de gestao no frontend
- Dependencies: Sprint 02

### Sprint 04

- Goal: entregar a operacao de pedidos com maquina de estados e atribuicao manual
- Focus: criacao de pedidos, status transitions, auditoria e regras de atribuicao
- Deliverables: modulo de pedidos completo, historico de status persistido e tela operacional de pedidos
- Dependencies: Sprint 03

### Sprint 05

- Goal: entregar os diferenciais algoritmicos e analiticos do case
- Focus: algoritmo de otimizacao, relatorios e dashboard de metricas
- Deliverables: endpoint `POST /api/orders/optimize-assignment`, endpoints de relatorios e telas de analytics/atribuicao otimizada
- Dependencies: Sprint 04

### Sprint 06

- Goal: fechar qualidade, entrega e validacao final
- Focus: testes obrigatorios, performance, documentacao, Docker e readiness de submissao
- Deliverables: repositorio pronto para entrega, com build, typecheck, lint, seed, testes e documentacao finalizados
- Dependencies: Sprints 01 a 05

O detalhamento operacional de cada sprint esta documentado nos arquivos individuais desta pasta.

## Final Completion Criteria

- Todas as rotas sob `/api` estao alinhadas a `docs/api-spec.md`, inclusive codigos HTTP, erros padronizados e regras de autorizacao.
- O frontend entrega fluxo completo de login, navegacao protegida, telas de pedidos, produtos, entregadores, relatorios e atribuicao otimizada.
- O schema Prisma e o seed suportam analytics, auditoria de status, atribuicao de entregadores e os filtros exigidos pelo desafio.
- Os minimos obrigatorios de testes backend e frontend foram atingidos e a base passa em build, typecheck e lint com `strict: true`.
- `docker-compose.yml`, README e `DECISIONS.md` estao atualizados e suficientes para execucao e avaliacao do projeto.
