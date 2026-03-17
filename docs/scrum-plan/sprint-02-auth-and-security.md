# Sprint 02 - Auth and Security

## Sprint Goal

Tornar autenticacao e seguranca utilizaveis ponta a ponta, com comportamento aderente ao contrato do desafio.

## Concept Focus

Identity, RBAC e cross-cutting API behavior, incluindo JWT, refresh token rotativo, guards, rate limiting e padroes de erro.

## Tasks / Stories

- `[Backend]` Implementar `POST /api/auth/login` e `POST /api/auth/refresh` com JWT, refresh rotativo em cookie `httpOnly` e bcrypt.
- `[Backend]` Implementar auth guard, role guard, rate limiting e respostas `401`, `403` e `429` conforme spec.
- `[Backend]` Aplicar validacao em body, params e query nas camadas compartilhadas.
- `[Frontend]` Criar tela de login com validacao, estados de erro, persistencia segura do access token e redirect automatico.
- `[Frontend]` Implementar expiracao/refresh e retorno forcado ao login quando a sessao nao puder ser renovada.
- `[QA]` Cobrir login valido, credenciais invalidas, token invalido/expirado e refresh.

## Expected Deliverables

- Fluxo completo de autenticacao entre frontend e backend.
- Infraestrutura de seguranca reutilizavel para todos os modulos protegidos.
- Guards e tratamento de erros aderentes a `docs/api-spec.md`.
- Cobertura inicial de testes para cenarios criticos de autenticacao.

## Dependencies

- Sprint 01 concluida com app shell, estrutura modular e configuracao de ambiente prontas.

## Acceptance Criteria

- Usuarios seed conseguem autenticar com sucesso.
- `admin` e `viewer` recebem permissoes coerentes com o papel.
- Access token e refresh token respeitam expiracao e mecanismo de transporte exigidos.
- Rotas protegidas retornam `401`, `403` e `429` corretamente conforme cada falha.
