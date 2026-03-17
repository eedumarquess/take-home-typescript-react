# Sprint 01 - Foundation and Architecture

## Sprint Goal

Estabelecer a base de execucao do projeto e congelar a arquitetura tecnica que sustentara os demais sprints.

## Concept Focus

Setup do monorepo, organizacao modular do backend e frontend, padroes compartilhados e preparacao do ambiente para desenvolvimento consistente.

## Tasks / Stories

- `[Platform]` Validar scripts de workspace, `.env`, paridade local/dev e startup de frontend, backend e PostgreSQL.
- `[Backend]` Criar esqueletos modulares para `auth`, `products`, `orders`, `delivery-persons`, `reports`, `optimization` e `shared`.
- `[Backend]` Definir pipeline compartilhado de validacao, formato padrao de erro e estrategia de guards.
- `[Frontend]` Substituir a home estatica por app shell, router, protected route pattern e estrutura por feature.
- `[DevOps/Docs]` Definir `docker-compose.yml`, revisar `.env.example` e ampliar `DECISIONS.md` com stack e arquitetura.

## Expected Deliverables

- Estrutura de modulos backend e frontend congelada e documentada.
- Shell inicial do app com base para roteamento e areas protegidas.
- Ambiente local e via Docker definidos com variaveis de ambiente coerentes.
- Convencoes de arquitetura e de cross-cutting concerns registradas no repositrio.

## Dependencies

- Baseline atual do repositorio com NestJS, Prisma, React + Vite, seed e scripts de workspace.

## Acceptance Criteria

- Frontend, backend e banco iniciam com a configuracao esperada.
- A arquitetura modular esta definida antes do inicio dos modulos de negocio.
- `.env.example`, `docker-compose.yml` e `DECISIONS.md` refletem a base tecnica escolhida.
- O projeto tem um app shell navegavel e pronto para receber autenticacao e telas operacionais.
