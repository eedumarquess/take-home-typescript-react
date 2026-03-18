# Sprint 03 - Products and Delivery Persons

## Sprint Goal

Entregar os dominios de catalogo e frota com CRUD real, regras operacionais aplicadas no backend e interfaces administrativas funcionais no frontend.

## Status

Esta sprint nao esta mais no estado de backlog. O repositorio atual ja contem implementacao funcional de produtos e entregadores no backend e no frontend, com testes automatizados cobrindo os fluxos principais.

Hoje, o estado real e este:

- o backend de `products` ja tem DTOs, controller, service, repository e mapper
- o backend de `delivery-persons` ja tem DTOs, controller, service, repository e mapper
- as regras `PRODUCT_IN_USE` e `DELIVERY_PERSON_IN_USE` ja estao implementadas
- o RBAC ja esta aplicado: `viewer` le produtos, escrita fica com `admin`, e entregadores ficam restritos a `admin`
- o frontend ja substituiu os placeholders por telas administrativas reais
- os modulos frontend ja consomem a API para listagem, criacao, edicao e exclusao
- ha cobertura de testes backend e frontend para os cenarios principais desses modulos

Em outras palavras: o escopo principal desta sprint foi implementado. Os pontos que ainda nao ficam comprovados so por leitura de codigo e testes direcionados devem ser tratados como validacao complementar, nao como trabalho principal ainda pendente.

## Repository Baseline Confirmed

Os seguintes pontos foram verificados no repositorio e devem ser tratados como entregas existentes desta sprint:

- `backend/prisma/schema.prisma` modela `Product` e `DeliveryPerson` com campos e indices alinhados ao desafio
- `backend/prisma/seed.ts` carrega produtos e entregadores a partir de `seed/data.json`
- `backend/src/products` ja contem DTOs de create/update/list, controller, service, repository, mapper e testes
- `backend/src/delivery-persons` ja contem DTOs de create/update/list, controller, service, repository, mapper e testes
- `frontend/src/features/products` ja contem tipos e camada de consumo de API
- `frontend/src/features/delivery-persons` ja contem tipos e camada de consumo de API
- `frontend/src/pages/products-page.tsx` ja implementa tabela, filtros, paginacao, formulario e fluxo de delete
- `frontend/src/pages/delivery-persons-page.tsx` ja implementa listagem, filtros, formulario e fluxo de delete
- `frontend/src/pages/products-page.test.tsx` e `frontend/src/pages/delivery-persons-page.test.tsx` cobrem fluxos principais de UI

Tambem foi validado por execucao de testes:

- `npm run test --workspace backend -- products.service.spec.ts delivery-persons.service.spec.ts`
- `npm run test --workspace frontend -- products-page.test.tsx delivery-persons-page.test.tsx`

## Scope of Sprint 03

O escopo desta sprint era fechar os modulos de produtos e entregadores de ponta a ponta:

- contratos REST aderentes a `docs/api-spec.md`
- regras de negocio e conflitos exigidos pelo desafio
- persistencia com Prisma sobre PostgreSQL
- aplicacao de RBAC nas rotas certas
- telas administrativas reais consumindo o backend
- cobertura minima de testes para backend e frontend nesses dominios

Esse escopo esta majoritariamente entregue no estado atual do repositorio.

## Sprint Stories

- `[Backend/Products]` Fechar CRUD completo de produtos com filtros, ordenacao, validacao e regra `PRODUCT_IN_USE`.
- `[Backend/DeliveryPersons]` Fechar CRUD completo de entregadores com filtros `isActive` e `available` e regra `DELIVERY_PERSON_IN_USE`.
- `[Frontend/Products]` Substituir placeholder por tela administrativa real de catalogo.
- `[Frontend/DeliveryPersons]` Substituir placeholder por tela administrativa real de frota.
- `[QA]` Adicionar cobertura de contratos, regras de conflito e fluxos principais de UI.

## Execution Stages

### Stage 1 - Backend products

Objetivo: transformar a base de modelagem de produtos em modulo CRUD utilizavel e aderente ao contrato.

Checklist:

- [x] Modelagem Prisma de `products` criada com campos e indices principais
- [x] Seed de produtos disponivel
- [x] DTO de listagem com filtros e ordenacao criado
- [x] Criar DTOs de `create product` e `update product` com validacao estrita dos campos
- [x] Implementar controller REST de produtos com `GET /api/products`
- [x] Implementar controller REST de produtos com `GET /api/products/:id`
- [x] Implementar controller REST de produtos com `POST /api/products`
- [x] Implementar controller REST de produtos com `PUT /api/products/:id`
- [x] Implementar controller REST de produtos com `DELETE /api/products/:id`
- [x] Aplicar `@Roles(AppRole.ADMIN)` nas rotas de escrita e leitura compartilhada para `admin` e `viewer`
- [x] Implementar paginacao, busca parcial por nome, filtro por categoria, filtro por disponibilidade e ordenacao por `name`, `price` e `createdAt`
- [x] Garantir serializacao consistente de `Decimal` para `price`
- [x] Retornar `PRODUCT_NOT_FOUND` quando o ID nao existir
- [x] Bloquear exclusao com `409 PRODUCT_IN_USE` quando houver vinculo com pedidos `pending` ou `preparing`
- [x] Garantir que produtos indisponiveis continuem visiveis no fluxo administrativo
- [x] Adicionar testes backend para listagem, consulta, criacao, atualizacao, delete permitido e delete bloqueado

### Stage 2 - Backend delivery persons

Objetivo: transformar a base de modelagem de entregadores em modulo CRUD com filtros operacionais reais.

Checklist:

- [x] Modelagem Prisma de `delivery_persons` criada
- [x] Seed de entregadores disponivel
- [x] DTO de listagem com filtros `isActive` e `available` criado
- [x] Criar DTOs de `create delivery person` e `update delivery person` com validacao de telefone, coordenadas e `vehicleType`
- [x] Implementar controller REST de entregadores com `GET /api/delivery-persons`
- [x] Implementar controller REST de entregadores com `POST /api/delivery-persons`
- [x] Implementar controller REST de entregadores com `PUT /api/delivery-persons/:id`
- [x] Implementar controller REST de entregadores com `DELETE /api/delivery-persons/:id`
- [x] Aplicar `@Roles(AppRole.ADMIN)` em todas as rotas de entregadores
- [x] Implementar filtro `available=true` excluindo entregadores com pedido `delivering`
- [x] Retornar `currentOrderId` na listagem conforme contrato
- [x] Retornar `DELIVERY_PERSON_NOT_FOUND` quando o ID nao existir
- [x] Bloquear exclusao com `409 DELIVERY_PERSON_IN_USE` quando houver pedido `delivering` vinculado
- [x] Adicionar testes backend para listagem com filtros, criacao, atualizacao, delete permitido e delete bloqueado

### Stage 3 - Frontend products

Objetivo: substituir o placeholder de produtos por um fluxo administrativo real.

Checklist:

- [x] Rota protegida `/products` registrada
- [x] Pagina placeholder substituida por implementacao real
- [x] Criar tipos e funcoes de API para listar, consultar, criar, atualizar e remover produtos
- [x] Implementar tela com tabela de produtos e estado de carregamento
- [x] Implementar filtros de busca, categoria e disponibilidade
- [x] Implementar controle de ordenacao e paginacao
- [x] Implementar formulario de criacao e edicao com validacao de UI alinhada ao backend
- [x] Implementar feedback de sucesso e erro para create/update/delete
- [x] Implementar confirmacao de exclusao
- [x] Destacar visualmente produtos indisponiveis sem remove-los da listagem administrativa
- [x] Ocultar ou desabilitar acoes de escrita para `viewer`
- [x] Adicionar testes frontend para renderizacao da tabela, filtros, submissao de formulario e tratamento de erro de delete bloqueado

### Stage 4 - Frontend delivery persons

Objetivo: substituir o placeholder de entregadores por uma tela de gestao operacional da frota.

Checklist:

- [x] Rota protegida `/delivery-persons` registrada
- [x] Pagina placeholder substituida por implementacao real
- [x] Criar tipos e funcoes de API para listar, criar, atualizar e remover entregadores
- [x] Implementar tela com listagem administrativa de entregadores
- [x] Implementar filtros por `isActive` e `available`
- [x] Exibir estado operacional do entregador, incluindo disponibilidade e `currentOrderId` quando existir
- [x] Implementar formulario de criacao e edicao com validacao de UI
- [x] Implementar feedback de sucesso e erro para create/update/delete
- [x] Implementar confirmacao de exclusao
- [x] Tratar resposta `DELIVERY_PERSON_IN_USE` com mensagem clara ao usuario
- [x] Restringir o modulo a `admin` no frontend, coerente com o contrato backend
- [x] Adicionar testes frontend para renderizacao, filtros e fluxo administrativo principal

### Stage 5 - Cross-cutting integration and QA

Objetivo: sair de estrutura pronta para entrega validada de sprint.

Checklist:

- [x] Garantir que os controllers usem o formato padrao de erro `error.code`, `error.message`, `error.details`
- [x] Reaproveitar DTOs e utilitarios compartilhados sem afrouxar `strict` nem usar `any`
- [x] Confirmar que os endpoints seguem exatamente os contratos de `docs/api-spec.md`
- [x] Cobrir no minimo 2 testes backend de CRUD de produtos
- [x] Cobrir no minimo 2 testes backend relacionados a entregadores nesta sprint
- [x] Cobrir no minimo 2 testes frontend somando produtos e entregadores
- [ ] Validar manualmente a integracao entre frontend e backend para ambos os modulos
- [ ] Atualizar README ou instrucoes operacionais se surgirem novos passos de uso para esses fluxos

## Expected Deliverables

- modulo backend de produtos com CRUD, filtros, ordenacao e conflitos implementados
- modulo backend de entregadores com CRUD, filtros operacionais e bloqueios de exclusao implementados
- telas reais de produtos e entregadores consumindo a API
- aplicacao correta de RBAC para `admin` e `viewer`
- testes backend e frontend cobrindo os cenarios principais da sprint

Todos esses entregaveis ja aparecem implementados no estado atual do repositorio.

## Explicit Non-Goals of Sprint 03

Os itens abaixo nao devem ser tratados como criterio isolado de conclusao desta sprint:

- criacao e operacao completa do dominio de pedidos
- fluxo manual de atribuicao de entregadores a pedidos
- algoritmo de otimizacao de atribuicao
- relatorios analiticos

Esses itens dependem desta sprint, mas pertencem principalmente aos sprints 04 e 05.

## Dependencies

- Sprint 02 concluida com autenticacao, guards, rate limiting e validacao global ativos
- `docs/api-spec.md`
- `docs/database-schema.md`
- `DECISIONS.md`
- `seed/data.json`

## Acceptance Criteria

- [x] `GET /api/products` suporta paginacao, busca, filtros e ordenacao conforme contrato
- [x] `GET /api/products/:id`, `POST`, `PUT` e `DELETE` de produtos funcionam com codigos de erro corretos
- [x] exclusao de produto vinculado a pedido `pending` ou `preparing` retorna `409 PRODUCT_IN_USE`
- [x] `GET /api/delivery-persons` suporta filtros por `isActive` e `available`
- [x] `POST`, `PUT` e `DELETE` de entregadores funcionam com codigos de erro corretos
- [x] exclusao de entregador vinculado a pedido `delivering` retorna `409 DELIVERY_PERSON_IN_USE`
- [x] `viewer` consegue ler produtos e nao consegue executar escrita
- [x] apenas `admin` acessa e opera o modulo de entregadores
- [x] o frontend permite listar, criar, editar e excluir com feedback claro ao usuario
- [x] os placeholders de produtos e entregadores deixaram de ser a entrega atual da sprint

## Remaining Validation

Os unicos itens que permanecem fora do que foi comprovado nesta atualizacao sao:

- validacao manual ponta a ponta com backend e frontend rodando juntos
- eventual ajuste de README caso o fluxo operacional desses modulos passe a exigir orientacao adicional

Fora isso, a sprint 03 deve ser lida como implementada no estado atual do repositorio.
