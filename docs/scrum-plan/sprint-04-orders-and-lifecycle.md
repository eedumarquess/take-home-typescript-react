# Sprint 04 - Orders and Lifecycle

## Sprint Goal

Entregar o dominio de pedidos de ponta a ponta, com criacao real, maquina de estados estrita, auditoria operacional e atribuicao manual de entregadores.

## Status

Esta sprint ainda nao esta implementada no estado atual do repositorio. O projeto ja possui a base de dados, enums e alguns contratos preliminares para pedidos, mas o modulo ainda nao existe como entrega funcional no backend nem no frontend.

Hoje, o estado real e este:

- o schema Prisma ja modela `Order`, `OrderItem` e `OrderStatusEvent`
- o seed ja popula pedidos, itens e historico de status a partir de `seed/data.json`
- o backend ja possui `OrderStatusValue`, `ListOrdersQueryDto` e codigos de erro especificos de pedidos
- o `OrdersModule` existe, mas esta apenas com `OrdersService` vazio e sem controller, repository, mapper ou testes
- a rota frontend `/orders` existe, mas `frontend/src/pages/orders-page.tsx` ainda e um placeholder
- ainda nao existe uma feature frontend dedicada para pedidos com tipos, camada de API e estado de tela
- ainda nao ha cobertura de testes backend ou frontend para listagem, criacao, transicoes de status ou atribuicao manual

Em outras palavras: a sprint 04 tem groundwork relevante, mas o escopo principal ainda precisa ser implementado.

## Repository Baseline Confirmed

Os seguintes pontos foram verificados no repositorio e devem ser tratados como base existente para esta sprint:

- `backend/prisma/schema.prisma` ja contem os modelos `Order`, `OrderItem` e `OrderStatusEvent`, com `deliveredAt`, relacao opcional com `DeliveryPerson` e indices para filtros e analytics
- `backend/prisma/seed.ts` ja cria pedidos, snapshots de `unitPrice`, `totalAmount`, `deliveryPersonId` e eventos de status a partir do seed
- `seed/data.json` ja oferece massa com pedidos em varios status, incluindo `ready`, `delivering`, `delivered` e `cancelled`
- `backend/src/common/enums/order-status.enum.ts` ja centraliza os status aceitos pelo dominio
- `backend/src/orders/dto/list-orders-query.dto.ts` ja define paginacao, filtro por status, faixa de datas e ordenacao basica
- `backend/src/common/errors/app-error-code.enum.ts` ja inclui `ORDER_NOT_FOUND`, `INVALID_STATUS_TRANSITION`, `UNAVAILABLE_PRODUCT`, `DELIVERY_PERSON_INACTIVE`, `DELIVERY_PERSON_UNAVAILABLE` e `ORDER_ASSIGNMENT_NOT_ALLOWED`
- `backend/src/app.module.ts` ja registra `OrdersModule`, entao o dominio esta na composition root
- `frontend/src/app/router.tsx` ja registra a rota protegida `/orders`
- `frontend/src/pages/orders-page.tsx` explicita o contrato da sprint, mas ainda nao entrega a funcionalidade

## Repository Gap Summary

Comparando o repositorio com o escopo descrito para a sprint, estas sao as lacunas principais:

- falta toda a superficie REST de pedidos: `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PATCH /api/orders/:id/status` e `PATCH /api/orders/:id/assign`
- falta a regra de criacao com calculo backend de `totalAmount`, snapshot de `unitPrice` e bloqueio de produtos indisponiveis
- falta a state machine estrita com validacao de transicoes, preenchimento de `deliveredAt` e persistencia de `order_status_events`
- falta a regra de atribuicao manual limitada a pedidos `ready` e entregadores ativos/disponiveis
- falta a interface operacional de pedidos com filtros, listagem, detalhe, badges de status e acoes contextuais
- falta o comportamento read-only de `viewer` no modulo de pedidos
- faltam testes backend e frontend exigidos para lifecycle de pedidos

## Scope of Sprint 04

O escopo desta sprint e fechar o dominio de pedidos como base operacional para as sprints seguintes:

- contratos REST completos e aderentes a `docs/api-spec.md`
- servico de negocio capaz de criar pedidos com consistencia transacional
- maquina de estados com transicoes estritas e auditoria persistida
- atribuicao manual coerente com disponibilidade operacional dos entregadores
- tela de pedidos funcional no frontend, com controles diferentes para `admin` e `viewer`
- cobertura de testes suficiente para provar regras de lifecycle e preparar a sprint 05

## Sprint Stories

- `[Backend/Orders]` Implementar leitura, detalhe e criacao de pedidos com `totalAmount` calculado, snapshot de `unitPrice` e validacao de disponibilidade de produto.
- `[Backend/Lifecycle]` Implementar `PATCH /api/orders/:id/status` com matriz estrita de transicoes, gravacao de `order_status_events` e controle de `deliveredAt`.
- `[Backend/Assignment]` Implementar `PATCH /api/orders/:id/assign` com regras de pedido `ready`, entregador ativo e indisponibilidade por pedido `delivering`.
- `[Frontend/Orders]` Substituir o placeholder por uma tela operacional de pedidos com filtros, badges, detalhes e acoes contextuais.
- `[Frontend/RBAC]` Garantir que `admin` opere mudancas de status e atribuicao, enquanto `viewer` permanece em modo leitura.
- `[QA]` Cobrir criacao, transicoes validas, transicoes invalidas, atribuicao permitida, atribuicao rejeitada e os estados principais da UI.

## Execution Stages

### Stage 1 - Backend orders read and create

Objetivo: sair da base de schema e seed para uma API real de pedidos, com criacao consistente e leitura completa.

Checklist:

- [x] Modelagem Prisma de `orders`, `order_items` e `order_status_events` criada
- [x] Seed de pedidos e historico de status disponivel
- [x] DTO de listagem com paginacao, status, periodo e ordenacao criado
- [ ] Criar DTOs de `create order`, `update order status` e `assign delivery person` com validacao estrita
- [ ] Criar repository de pedidos com filtros, ordenacao, joins e serializacao consistente de `Decimal`
- [ ] Criar mapper de pedidos para o payload esperado em `docs/api-spec.md`
- [ ] Implementar `GET /api/orders` com paginacao, filtro por status, faixa de datas e ordenacao por `createdAt` ou `totalAmount`
- [ ] Implementar `GET /api/orders/:id` com retorno do pedido completo, itens e entregador
- [ ] Implementar `POST /api/orders` com status inicial `pending`
- [ ] Calcular `totalAmount` exclusivamente no backend
- [ ] Registrar `unitPrice` de cada item no momento da criacao
- [ ] Bloquear criacao quando qualquer produto nao existir ou estiver indisponivel
- [ ] Retornar `422 UNAVAILABLE_PRODUCT` com `details` descritivos quando houver item indisponivel
- [ ] Retornar `404 ORDER_NOT_FOUND` quando o pedido nao existir
- [ ] Aplicar RBAC: leitura para `admin` e `viewer`, escrita apenas para `admin`

### Stage 2 - Backend lifecycle and audit trail

Objetivo: implementar a state machine do dominio sem brechas de transicao e com historico persistido.

Checklist:

- [ ] Codificar explicitamente a matriz valida de transicoes:
- [ ] `pending -> preparing`
- [ ] `pending -> cancelled`
- [ ] `preparing -> ready`
- [ ] `preparing -> cancelled`
- [ ] `ready -> delivering` apenas com `deliveryPersonId`
- [ ] `ready -> cancelled`
- [ ] `delivering -> delivered`
- [ ] Implementar `PATCH /api/orders/:id/status`
- [ ] Rejeitar qualquer transicao fora da matriz com `422 INVALID_STATUS_TRANSITION`
- [ ] Exigir `deliveryPersonId` antes de `ready -> delivering`
- [ ] Preencher `deliveredAt` somente quando o pedido chegar a `delivered`
- [ ] Garantir que transicoes para estados diferentes de `delivered` nao preencham `deliveredAt`
- [ ] Registrar evento inicial `pending` na criacao do pedido
- [ ] Registrar um `order_status_event` a cada transicao valida subsequente
- [ ] Garantir consistencia transacional entre update do pedido e criacao do evento de status

### Stage 3 - Backend manual assignment

Objetivo: permitir atribuicao manual sem violar as restricoes operacionais da frota.

Checklist:

- [ ] Implementar `PATCH /api/orders/:id/assign`
- [ ] Permitir atribuicao apenas quando o pedido estiver em `ready`
- [ ] Permitir reatribuicao apenas enquanto o pedido permanecer em `ready`
- [ ] Validar existencia do entregador e retornar `404 DELIVERY_PERSON_NOT_FOUND` quando necessario
- [ ] Bloquear entregador inativo com `422 DELIVERY_PERSON_INACTIVE`
- [ ] Bloquear entregador que ja possua pedido `delivering` com `422 DELIVERY_PERSON_UNAVAILABLE`
- [ ] Bloquear atribuicao fora de `ready` com `422 ORDER_ASSIGNMENT_NOT_ALLOWED`
- [ ] Retornar pedido atualizado com o entregador atribuido
- [ ] Reaproveitar a mesma semantica de disponibilidade que sera consumida pela sprint 05

### Stage 4 - Frontend orders experience

Objetivo: substituir o placeholder por uma tela operacional de pedidos aderente ao contrato da API.

Checklist:

- [x] Rota protegida `/orders` registrada
- [ ] Criar `frontend/src/features/orders` com tipos e funcoes de API para listar, detalhar, criar, alterar status e atribuir entregador
- [ ] Substituir `frontend/src/pages/orders-page.tsx` por implementacao real
- [ ] Implementar carregamento inicial com estado de loading
- [ ] Implementar estado de erro e estado vazio
- [ ] Implementar filtros por status, periodo e ordenacao
- [ ] Implementar listagem com informacoes essenciais: cliente, itens resumidos, total, status, entregador e data
- [ ] Exibir badges ou indicadores visuais distintos para cada status
- [ ] Implementar painel, drawer ou modal de detalhes do pedido
- [ ] Exibir acoes contextuais de acordo com as transicoes validas
- [ ] Exibir fluxo manual de atribuicao de entregador para pedidos `ready`
- [ ] Atualizar a UI apos atribuicao e mudanca de status sem exigir reload manual
- [ ] Tratar erros de negocio com mensagens claras para `INVALID_STATUS_TRANSITION`, `UNAVAILABLE_PRODUCT`, `DELIVERY_PERSON_INACTIVE`, `DELIVERY_PERSON_UNAVAILABLE` e `ORDER_ASSIGNMENT_NOT_ALLOWED`

### Stage 5 - Frontend RBAC and operational guardrails

Objetivo: alinhar a experiencia do frontend com o contrato de autorizacao do backend.

Checklist:

- [ ] Exibir o modulo de pedidos para `viewer` em modo leitura
- [ ] Ocultar ou desabilitar acoes de escrita para `viewer`
- [ ] Exibir acoes de criar pedido, atribuir entregador e mudar status apenas para `admin`
- [ ] Garantir que expiracao de sessao continue redirecionando para login durante o uso da tela de pedidos

### Stage 6 - QA and integration proof

Objetivo: sair de base estrutural para sprint comprovadamente entregue.

Checklist:

- [ ] Adicionar no minimo 2 testes backend de transicao de status de pedido
- [ ] Adicionar testes backend para criacao com `totalAmount` calculado e snapshot de `unitPrice`
- [ ] Adicionar testes backend para rejeicao de produto indisponivel
- [ ] Adicionar testes backend para atribuicao permitida e atribuicao rejeitada
- [ ] Adicionar testes HTTP ou e2e cobrindo `401`, `403`, `404` e `422` relevantes do modulo de pedidos
- [ ] Adicionar testes frontend de renderizacao da tela de pedidos
- [ ] Adicionar testes frontend de interacao para filtros, mudanca de status ou atribuicao
- [ ] Validar manualmente o fluxo ponta a ponta entre frontend e backend
- [ ] Confirmar que a sprint 05 pode assumir pedidos, status e atribuicao manual como base confiavel

## Expected Deliverables

- modulo backend de pedidos com leitura, detalhe, criacao, mudanca de status e atribuicao manual
- persistencia correta de `order_items`, `order_status_events` e `deliveredAt`
- tela real de pedidos no frontend, substituindo o placeholder atual
- aplicacao correta de RBAC para `admin` e `viewer` no modulo de pedidos
- testes backend e frontend cobrindo o lifecycle principal da sprint

## Explicit Non-Goals of Sprint 04

Os itens abaixo dependem desta sprint, mas pertencem principalmente ao sprint 05:

- `POST /api/orders/optimize-assignment`
- tela de sugestao de atribuicao otimizada
- dashboard analitico e endpoints de relatorio
- documentacao final da abordagem algoritmica em `DECISIONS.md`

## Dependencies

- Sprint 03 concluida com produtos e entregadores operacionais
- `docs/api-spec.md`
- `docs/database-schema.md`
- `DECISIONS.md`
- `seed/data.json`

## Acceptance Criteria

No estado atual do repositorio, os criterios abaixo ainda devem ser tratados como meta de entrega, nao como concluido:

- [ ] `GET /api/orders` suporta paginacao, filtro por status, faixa de datas e ordenacao conforme contrato
- [ ] `GET /api/orders/:id` retorna o pedido completo com itens, entregador e timestamps corretos
- [ ] `POST /api/orders` calcula `totalAmount`, registra `unitPrice` e inicia o pedido em `pending`
- [ ] produtos indisponiveis sao rejeitados com `422 UNAVAILABLE_PRODUCT`
- [ ] apenas as transicoes listadas em `docs/api-spec.md` sao aceitas
- [ ] `ready -> delivering` falha sem `deliveryPersonId` atribuido
- [ ] `PATCH /api/orders/:id/assign` so funciona para pedidos `ready`
- [ ] atribuicao manual respeita entregador ativo e indisponibilidade por pedido `delivering`
- [ ] `viewer` consegue visualizar pedidos sem acesso a acoes de escrita
- [ ] o frontend substitui o placeholder atual por um fluxo operacional real de pedidos

## Remaining Risk

Se esta sprint continuar incompleta, o sprint 05 fica bloqueado ou forcado a trabalhar sobre stubs, porque tanto o algoritmo de atribuicao quanto os relatorios dependem de um dominio de pedidos consistente, auditavel e operacional no frontend e no backend.
