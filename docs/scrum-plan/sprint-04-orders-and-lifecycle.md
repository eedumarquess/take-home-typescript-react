# Sprint 04 - Orders and Lifecycle

## Sprint Goal

Entregar a operacao de pedidos com state machine estrita, auditoria de status e fluxo de atribuicao manual.

## Concept Focus

Orders, assignment rules e status history, com foco nas invariantes de negocio mais sensiveis do sistema.

## Tasks / Stories

- `[Backend]` Implementar list/detail/create de pedidos com `totalAmount` calculado, snapshot de `unitPrice`, filtros e ordenacao.
- `[Backend]` Rejeitar criacao com produtos indisponiveis via `UNAVAILABLE_PRODUCT`.
- `[Backend]` Implementar `PATCH /api/orders/:id/status` com transicoes estritas, `deliveredAt` e `order_status_events`.
- `[Backend]` Implementar `PATCH /api/orders/:id/assign` com regras de `ready`, entregador ativo e disponibilidade.
- `[Frontend]` Construir tela de pedidos com filtros, badges de status, detalhes e acoes contextuais.
- `[Frontend]` Implementar fluxo manual de atribuicao e mudanca de status para admin; viewer fica read-only.
- `[QA]` Cobrir transicoes validas, invalidas, atribuicao permitida e rejeicoes `422`.

## Expected Deliverables

- Modulo de pedidos completo para listagem, consulta, criacao e operacao de ciclo de vida.
- Persistencia de historico de status e preenchimento correto de `deliveredAt`.
- Fluxo administrativo no frontend para acompanhamento e operacao dos pedidos.
- Testes cobrindo state machine, atribuicao e regras de validacao.

## Dependencies

- Sprint 03 concluida com produtos e entregadores disponiveis para compor as regras de pedidos.

## Acceptance Criteria

- O backend calcula `totalAmount` e registra `unitPrice` no momento da criacao.
- Apenas as transicoes listadas em `docs/api-spec.md` sao aceitas.
- A atribuicao manual respeita status `ready`, atividade do entregador e indisponibilidade por pedido em andamento.
- Viewer visualiza pedidos sem acesso a acoes de escrita.
