# Frontend FastMeals

Dashboard administrativo FastMeals em React 19 + Vite.

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

## Scripts uteis

```bash
npm run test --workspace frontend
npm run lint --workspace frontend
npm run typecheck --workspace frontend
```

## Testes

- Vitest + Testing Library
- cobrindo login, roteamento protegido, produtos, pedidos, entregadores, dashboard e relatorios

## Docker

O `frontend/Dockerfile` gera o build Vite e publica a SPA em Nginx com fallback para rotas do React Router.

Subida completa a partir da raiz:

```bash
docker compose up --build
```
