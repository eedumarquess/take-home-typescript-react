# Frontend FastMeals

Dashboard administrativo FastMeals em React 19 + Vite + TanStack Query.

## Requisitos

- Node.js 22+
- npm 10+

## Variaveis de ambiente

O frontend le ambiente da raiz do monorepo.

```env
VITE_API_URL=http://localhost:3001/api
```

## Execucao

Desenvolvimento:

```bash
npm run dev --workspace frontend
```

Build:

```bash
npm run build --workspace frontend
```

Preview local:

```bash
npm run preview --workspace frontend
```

Aplicacao publicada em `http://localhost:3000`.

## Fluxos implementados

- login com restauracao de sessao por refresh cookie
- dashboard operacional alimentado por `/api/reports`
- produtos com filtros, edicao parcial e toggle de disponibilidade
- pedidos com polling de 30s enquanto a aba esta visivel
- sugestoes de optimize-assignment com recomputo dos cards de resumo
- entregadores com redirecionamento de `viewer` para `/dashboard`
- relatorios com validacao inline de intervalo de datas

## Arquitetura de dados

- auth state em contexto de sessao
- dados de dominio com TanStack Query para cache, invalidation e refetch
- utilitarios compartilhados em `src/services`
- rotas protegidas com React Router

## Scripts uteis

```bash
npm run test --workspace frontend
npm run lint --workspace frontend
npm run typecheck --workspace frontend
```

## Testes

- Vitest + Testing Library
- cobrindo login, roteamento protegido, dashboard, produtos, pedidos, entregadores e relatorios

## Docker

O `frontend/Dockerfile` gera o build Vite e publica a SPA em Nginx com fallback para rotas do React Router.

Subida completa a partir da raiz:

```bash
docker compose up --build
```
