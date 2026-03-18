# Sprint 02 - Auth and Security

## Sprint Goal

Fechar a camada de autenticacao e seguranca do FastMeals como uma base reutilizavel para todos os endpoints protegidos e para a navegacao autenticada do dashboard.

## Status

Esta sprint nao deve mais ser lida como backlog puro. O nucleo de autenticacao e boa parte da seguranca transversal ja foram implementados no repositorio atual. O documento anterior estava desatualizado porque ainda tratava login, refresh, guards e restauracao de sessao como itens futuros.

O backlog real desta sprint agora se divide em dois blocos:

- consolidar no documento o que ja foi entregue na base compartilhada
- explicitar o que ainda depende da implementacao dos modulos de dominio e de cobertura de testes de integracao

## Scope of Sprint 02

O escopo correto desta sprint e entregar e estabilizar a infraestrutura de identidade e seguranca consumida pelos sprints de negocio. Isso inclui:

- autenticacao com `POST /api/auth/login`, `POST /api/auth/refresh` e `POST /api/auth/logout`
- access token JWT com expiracao de `15m`
- refresh token rotativo com expiracao de `7d`, transporte por cookie `httpOnly` e persistencia de sessao por `jti`
- guards globais para autenticacao, autorizacao por papel e rate limiting
- convencoes de resposta para `401`, `403` e `429`
- validacao de entrada e erro padronizado para contratos sensiveis de auth
- bootstrap de sessao no frontend, rotas publicas/protegidas e renovacao automatica de token
- testes iniciais que protegem os fluxos criticos da fundacao de seguranca

Aplicar RBAC e cobertura completa nos endpoints de produtos, pedidos, entregadores e relatorios continua dependente da implementacao desses dominios nos sprints seguintes.

## Repository Baseline Confirmed

O estado atual do repositorio confirma que a fundacao principal de auth/security ja existe:

- `backend/src/auth/controllers/auth.controller.ts` expoe `login`, `refresh` e `logout`
- `backend/src/auth/services/auth.service.ts` valida senha com `bcrypt`, emite JWTs, persiste refresh sessions e faz rotacao de refresh token
- `backend/src/common/guards/access-token.guard.ts` valida Bearer token e diferencia `TOKEN_EXPIRED` de `INVALID_TOKEN`
- `backend/src/common/guards/roles.guard.ts` ja suporta RBAC por `@Roles(...)`
- `backend/src/common/guards/rate-limit.guard.ts` aplica limitacao em memoria por IP
- `backend/src/app.module.ts` registra `RateLimitGuard`, `AccessTokenGuard` e `RolesGuard` como guards globais
- `backend/src/bootstrap/configure-app.ts` aplica `ValidationPipe` global, `cookie-parser` e CORS com credenciais
- `backend/test/support/create-test-app.ts` agora registra probes tecnicos apenas no harness e2e para validar `401`, `403` e `429` sem antecipar endpoints de negocio
- `frontend/src/features/auth/auth-context.tsx` restaura sessao via `/api/auth/refresh`, mantem o access token apenas em memoria e derruba a sessao quando o refresh falha
- `frontend/src/features/auth/protected-route.tsx` e `frontend/src/features/auth/public-route.tsx` protegem navegacao autenticada e redirect
- `frontend/src/services/api.ts` envia Bearer token, inclui cookies e tenta renovar a sessao automaticamente apos `401`
- o repositorio ja possui testes unitarios e de interface cobrindo partes relevantes da fundacao de auth

Tambem ficou claro o que ainda nao esta fechado nesta sprint:

- ainda nao existem controllers de negocio consumindo `@Roles(...)` e os guards nas rotas de produtos, pedidos, entregadores e relatorios
- a cobertura de auth/security em nivel HTTP foi fechada via harness e2e dedicado, sem expor novas rotas publicas no runtime normal
- a cobertura frontend agora inclui expiracao de sessao durante requests reais e redirecionamento forcado ao login apos falha de renovacao

## Sprint Stories

- `[Backend/Auth]` Consolidar o fluxo de login, refresh rotativo e logout com persistencia de sessao.
- `[Backend/Security]` Congelar guards globais, codigos de erro e validacao para todo o backend protegido.
- `[Backend/RBAC]` Preparar decoradores e contratos de papel para `admin` e `viewer`, deixando o consumo pronto para os modulos de dominio.
- `[Frontend/Auth]` Fechar a experiencia de login, bootstrap de sessao e renovacao automatica do access token.
- `[QA]` Cobrir os fluxos criticos de autenticacao e as falhas de seguranca mais sensiveis.

## Execution Stages

### Stage 1 - Authentication core

Objetivo: estabelecer o contrato central de autenticacao do sistema.

Checklist:

- [x] Implementar `POST /api/auth/login` com validacao de credenciais e retorno de access token
- [x] Validar senha com `bcrypt`
- [x] Emitir access token com expiracao de `15m`
- [x] Emitir refresh token com expiracao de `7d`
- [x] Persistir sessoes de refresh por `jti`
- [x] Implementar `POST /api/auth/refresh` com rotacao de refresh token
- [x] Revogar a sessao anterior quando o refresh for consumido
- [x] Implementar `POST /api/auth/logout` revogando a sessao ativa e limpando o cookie

### Stage 2 - API security and contracts

Objetivo: fechar o comportamento transversal de seguranca no backend.

Checklist:

- [x] Exigir Bearer token nas rotas privadas por guard global
- [x] Diferenciar `INVALID_TOKEN` de `TOKEN_EXPIRED`
- [x] Implementar `RolesGuard` para suportar autorizacao por papel
- [x] Implementar decoradores `@Public()` e `@Roles(...)`
- [x] Aplicar rate limiting global com meta de `100 requests por minuto por IP`
- [x] Padronizar respostas de erro em `error.code`, `error.message`, `error.details`
- [x] Aplicar validacao global para body, params e query
- [x] Configurar CORS com credenciais e `cookie-parser`

### Stage 3 - Frontend session lifecycle

Objetivo: tornar a autenticacao utilizavel no dashboard.

Checklist:

- [x] Criar tela de login integrada ao backend
- [x] Manter access token apenas em memoria no cliente
- [x] Restaurar sessao ao carregar a aplicacao usando refresh token em cookie
- [x] Proteger rotas privadas com redirect para `/login`
- [x] Impedir acesso a `/login` quando a sessao ja estiver autenticada
- [x] Renovar o access token automaticamente apos `401` quando houver refresh valido
- [x] Limpar a sessao local quando a renovacao falhar
- [x] Cobrir com testes a queda de sessao durante chamadas autenticadas reais
- [x] Cobrir com testes o redirect forcado para login apos refresh invalido em fluxo de API

### Stage 4 - RBAC integration for domain modules

Objetivo: deixar a seguranca pronta para ser consumida pelos sprints de negocio.

Checklist:

- [x] Definir papeis `admin` e `viewer` na camada compartilhada
- [x] Registrar a infraestrutura de RBAC no backend
- [ ] Aplicar `@Roles(AppRole.ADMIN)` nas rotas de escrita de produtos
- [ ] Aplicar `@Roles(AppRole.ADMIN)` nas rotas de escrita de pedidos
- [ ] Aplicar `@Roles(AppRole.ADMIN)` em todas as rotas de entregadores
- [ ] Aplicar leitura compartilhada `admin/viewer` nas rotas de produtos, pedidos e relatorios
- [x] Validar por teste que `viewer` recebe `403` em um endpoint administrativo protegido pelo mesmo `RolesGuard`

### Stage 5 - Security-focused test coverage

Objetivo: sair de cobertura apenas estrutural para cobertura aderente ao contrato HTTP.

Checklist:

- [x] Cobrir login valido e credenciais invalidas em teste unitario de auth service
- [x] Cobrir rotacao e reutilizacao invalida de refresh token em teste unitario de auth service
- [x] Cobrir o guard de rate limiting em teste unitario
- [x] Cobrir a validacao HTTP basica de `/api/auth/login` em e2e
- [x] Cobrir restauracao de sessao e fallback para anonimo no frontend
- [x] Cobrir tela de login e redirect de rota protegida no frontend
- [x] Adicionar e2e backend para login bem-sucedido com `Set-Cookie`
- [x] Adicionar e2e backend para refresh bem-sucedido e refresh invalido
- [x] Adicionar e2e backend para logout com limpeza do cookie e revogacao de sessao
- [x] Adicionar e2e backend para `401` em rota protegida sem Bearer token
- [x] Adicionar e2e backend para `403` em endpoint administrativo acessado por `viewer`
- [x] Adicionar e2e backend para `429` quando o limite por IP for excedido

## Delivered Outcomes

- base de autenticacao JWT com refresh token rotativo implementada
- sessao persistida no backend por `refresh_sessions`
- guards globais de autenticacao, autorizacao e rate limiting conectados ao `AppModule`
- contrato de erro e validacao compartilhado para cenarios de auth/security
- shell frontend com login, refresh silencioso, `ProtectedRoute` e `PublicRoute`
- cobertura backend e frontend agora inclui os fluxos HTTP criticos de login, refresh, logout, `401`, `403`, `429` e expiracao de sessao no cliente

## Explicit Non-Goals of Sprint 02

Os itens abaixo nao sao criterio de conclusao isolado desta sprint:

- implementar os CRUDs completos de produtos, pedidos e entregadores
- implementar relatorios e algoritmo de otimizacao
- finalizar telas operacionais com dados reais de negocio
- concluir a matriz completa de RBAC nas rotas de dominio antes da existencia desses controllers

Esses itens consomem a infraestrutura de seguranca desta sprint, mas pertencem aos sprints seguintes.

## Dependencies

- Sprint 01 concluida com bootstrap backend/frontend e convencoes globais operacionais
- `docs/api-spec.md`
- `DECISIONS.md`
- seed com usuarios `admin@fastmeals.com` e `viewer@fastmeals.com`

## Acceptance Criteria

- usuarios seed conseguem autenticar com sucesso por `POST /api/auth/login`
- `POST /api/auth/refresh` renova a sessao e rotaciona o refresh token
- `POST /api/auth/logout` invalida a sessao e limpa o cookie
- access token e refresh token respeitam expiracao e transporte exigidos pelo desafio
- requests sem token, com token invalido ou com token expirado recebem `401` padronizado
- requests com papel insuficiente recebem `403` padronizado
- o frontend restaura a sessao ao carregar e retorna ao login quando ela nao pode ser renovada
- os proximos sprints podem implementar regras de negocio reutilizando a base de auth/security sem rediscutir o contrato
