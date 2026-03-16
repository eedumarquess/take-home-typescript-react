# FastMeals Take-Home

Monorepo TypeScript com:

- `frontend/`: React + Vite
- `backend/`: NestJS + Prisma
- `seed/`: dados iniciais do desafio
- `docs/`: especificacoes e material de apoio
- `DECISIONS.md`: decisoes arquiteturais correntes do projeto

O repositório está preparado para desenvolvimento local, lint/format com Biome e integração com PostgreSQL via Prisma.

## Status atual

Este projeto está bootstrapado, mas ainda não implementa todas as funcionalidades do desafio.

Já configurado:

- React + Vite no frontend
- NestJS no backend
- Prisma com schema PostgreSQL
- Seed a partir de `seed/data.json`
- Biome como ferramenta principal de lint e format
- contrato de autenticacao com access token Bearer + refresh token rotativo em cookie `httpOnly`
- Scripts de workspace no root

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL rodando localmente

## Variáveis de ambiente

Use o arquivo `.env.example` como referência. Para desenvolvimento local, o projeto usa um `.env` na raiz.

Exemplo:

```env
DATABASE_URL=postgresql://fastmeals:fastmeals123@localhost:5432/fastmeals
JWT_SECRET=sua-chave-secreta-aqui-trocar-em-producao
JWT_REFRESH_SECRET=sua-chave-refresh-aqui-trocar-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
```

## Instalação

```bash
npm install
```

## Banco de dados

Gerar o client Prisma:

```bash
npm run prisma:generate --workspace backend
```

Aplicar o schema no banco:

```bash
npm run db:push --workspace backend
```

Popular o banco com os dados do desafio:

```bash
npm run seed --workspace backend
```

Abrir o Prisma Studio:

```bash
npm run db:studio --workspace backend
```

## Rodando o projeto

Subir frontend e backend juntos:

```bash
npm run dev
```

Subir apenas o frontend:

```bash
npm run dev:frontend
```

Subir apenas o backend:

```bash
npm run dev:backend
```

URLs padrão:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

## Scripts úteis

Na raiz:

```bash
npm run lint
npm run lint:fix
npm run format
npm run typecheck
npm run build
```

No backend:

```bash
npm run test --workspace backend
npm run test:e2e --workspace backend
```

## Estrutura

```text
.
|-- backend/
|   |-- prisma/
|   |-- src/
|   `-- test/
|-- docs/
|-- frontend/
|   |-- public/
|   `-- src/
|-- seed/
|-- biome.json
`-- package.json
```

## Observações

- O frontend lê variáveis de ambiente da raiz via `envDir` no Vite.
- O backend usa `ConfigModule` e aplica o prefixo global `/api`.
- O Prisma está fixado em `6.18.x` para manter compatibilidade simples com o setup atual do NestJS.
- O comando `npm run lint` combina `biome check` com typecheck dos dois workspaces.

## Documentação do desafio

- `docs/case.md`
- `docs/api-spec.md`
- `docs/database-schema.md`
- `docs/evaluation-criteria.md`
