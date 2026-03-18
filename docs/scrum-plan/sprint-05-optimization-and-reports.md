# Sprint 05 - Optimization and Reports

## Sprint Goal

Entregar os diferenciais analiticos e algoritmicos do case com sugestao automatizada de atribuicao, endpoints de relatorio aderentes ao contrato e uma experiencia de dashboard realmente operacional no frontend.

## Status

Sprint implementada no repositorio atual.

Hoje, o estado real e este:

- o backend expoe `POST /api/orders/optimize-assignment` com Haversine, matching Hungarian, semantica explicita para vazio e metadados de execucao
- o backend expoe `GET /api/reports/revenue`, `GET /api/reports/orders-by-status`, `GET /api/reports/top-products` e `GET /api/reports/average-delivery-time`
- a regra de entregador disponivel foi consolidada para reutilizar a mesma semantica entre listagem de frota e otimizacao
- o frontend substituiu o placeholder de `/reports` por um dashboard responsivo com filtros, loading, erro, vazio e multiplos paineis reais
- a tela de pedidos agora carrega sugestoes automatizadas, mostra pedidos nao atribuidos e permite aceite individual ou em lote reutilizando o fluxo operacional oficial
- a sprint ganhou testes backend unitarios/e2e para optimization e reports e testes frontend para dashboard e sugestao

Pendencias remanescentes fora do escopo implementado neste turno:

- ainda nao houve validacao manual completa com backend/frontend rodando contra o seed real
- o `lint` global do repositorio continua falhando por passivo anterior de formatacao/line endings fora da sprint 05, embora os arquivos alterados nesta entrega tenham sido validados isoladamente

## Delivery Log

- [x] Backend optimization: endpoint publicado, DTOs adicionados, Haversine implementado e matriz de custo entregue.
- [x] Backend matching: Hungarian algorithm aplicado com `O(n^3)`, limite de um pedido por entregador e resposta explicita para pedidos nao atendidos.
- [x] Backend reports: endpoints de receita, status, top products e tempo medio implementados com filtros opcionais de periodo.
- [x] Frontend analytics: dashboard real entregue em `/reports`, com filtros aplicados, cards, graficos e estados de tela.
- [x] Frontend optimization UX: sugestoes exibidas na tela de pedidos, com aceite individual e em lote usando o fluxo `assign -> delivering`.
- [x] QA automatizado: testes backend e frontend adicionados para optimization, reports e fluxo de sugestao.
- [x] Documentacao: `DECISIONS.md` atualizado com a estrategia algoritmica, semantica de filtros e trade-offs principais.

## Repository Baseline Confirmed

Os seguintes pontos foram verificados no repositorio e devem ser tratados como base existente para esta sprint:

- `backend/src/app.module.ts` ja registra `ReportsModule` e `OptimizationModule` na composition root
- `backend/src/optimization/optimization.module.ts` e `backend/src/reports/reports.module.ts` ja existem como boundaries dedicados
- `backend/src/optimization/optimization.service.ts` e `backend/src/reports/reports.service.ts` ja reservam o lugar dos servicos principais
- `backend/src/reports/dto/report-date-range-query.dto.ts` e `backend/src/reports/dto/top-products-report-query.dto.ts` indicam que os filtros de periodo e limite de top produtos ja foram antecipados
- `backend/src/orders/orders.service.ts` ja implementa atribuicao manual e state machine estrita, que passam a ser base direta para a sugestao automatizada
- `backend/src/orders/orders.controller.ts` ainda nao expoe `POST /api/orders/optimize-assignment`, entao o endpoint desta sprint continua faltando
- `backend/prisma/schema.prisma` e o seed ja oferecem pedidos `ready`, pedidos `delivered`, `deliveredAt` e entregadores ativos, o que viabiliza optimization e analytics
- `frontend/src/app/router.tsx` ja registra a rota protegida `/reports`
- `frontend/src/pages/reports-page.tsx` ja explicita o contrato visual desta sprint, mas ainda sem dados reais
- `frontend/src/pages/orders-page.tsx` ja entrega o fluxo manual de atribuicao e pode servir de base para incorporar sugestoes automatizadas

## Repository Gap Summary

Comparando o repositorio com o escopo descrito para a sprint, estas sao as lacunas principais:

- falta o endpoint `POST /api/orders/optimize-assignment` com leitura de pedidos `ready`, entregadores disponiveis, calculo de distancia e payload de sugestoes
- falta a implementacao do algoritmo de atribuicao com complexidade razoavel para a escala do desafio
- falta a semantica de disponibilidade operacional reutilizavel entre atribuicao manual e atribuicao otimizada
- faltam os endpoints `GET /api/reports/revenue`, `GET /api/reports/orders-by-status`, `GET /api/reports/top-products` e `GET /api/reports/average-delivery-time`
- faltam agregacoes de analytics coerentes com as regras do dominio, em especial os recortes por periodo e o filtro de `delivered` para top products
- falta o dashboard frontend com pelo menos dois graficos reais, cards de apoio e estados de loading, erro e vazio
- falta o fluxo frontend para visualizar sugestoes de atribuicao otimizada e decidir como aplica-las
- faltam testes backend para optimization e reports e testes frontend para dashboard e fluxo de sugestao

## Scope of Sprint 05

O escopo desta sprint e fechar a camada de inteligencia operacional e analitica do produto:

- endpoint de otimizacao aderente a `docs/api-spec.md`
- implementacao documentada do calculo de distancia e da estrategia de matching
- endpoints de relatorio com filtros de periodo e regras corretas de agregacao
- dashboard frontend responsivo com visualizacoes reais e estados robustos de tela
- fluxo operacional de sugestao otimizada apoiando a atribuicao manual ja entregue na sprint 04
- cobertura de testes suficiente para provar calculo, regras de filtro e comportamento da UI

## Sprint Stories

- `[Backend/Optimization]` Implementar `POST /api/orders/optimize-assignment` com matriz de custo baseada em Haversine e estrategia de matching nao-bruteforce.
- `[Backend/Reports]` Implementar os endpoints de relatorio de receita, pedidos por status, top produtos e tempo medio de entrega com filtros opcionais de periodo.
- `[Backend/Operational Rules]` Consolidar o conceito de entregador disponivel para evitar divergencia entre atribuicao manual, listagem de frota e otimizacao.
- `[Frontend/Analytics]` Substituir o placeholder de relatorios por um dashboard responsivo com pelo menos dois graficos e estados de loading, erro e vazio.
- `[Frontend/Optimization UX]` Implementar uma experiencia de sugestao de atribuicao otimizada a partir da tela de pedidos ou de um fluxo dedicado.
- `[Docs]` Atualizar `DECISIONS.md` com a estrategia escolhida para matching, complexidade, trade-offs e limites conhecidos.
- `[QA]` Cobrir cenarios de otimizacao balanceada, falta de entregadores, falta de pedidos elegiveis e consistencia dos relatorios principais.

## Execution Stages

### Stage 1 - Backend optimization contract and distance model

Objetivo: sair do modulo vazio para um servico de otimizacao com contratos, dados de entrada corretos e calculo de distancia confiavel.

Checklist:

- [x] Criar DTOs de request e response para `POST /api/orders/optimize-assignment`
- [x] Implementar controller ou extensao do modulo de pedidos para expor o endpoint conforme `docs/api-spec.md`
- [x] Buscar todos os pedidos com status `ready`
- [x] Buscar todos os entregadores ativos e disponiveis
- [x] Reaproveitar a regra de indisponibilidade baseada em pedido `delivering`
- [x] Implementar a formula de Haversine com retorno em quilometros
- [x] Construir matriz de custo entre pedidos elegiveis e entregadores elegiveis
- [x] Definir comportamento explicito quando nao houver pedidos ou entregadores elegiveis
- [x] Retornar `assignments`, `unassigned`, `totalDistanceKm`, `algorithm` e `executionTimeMs` no formato definido em `docs/api-spec.md`

### Stage 2 - Backend assignment strategy and application semantics

Objetivo: entregar uma estrategia de matching eficiente e previsivel para o volume esperado do desafio.

Checklist:

- [x] Implementar Hungarian algorithm ou heuristica documentada com complexidade aceitavel para ate 50 pedidos e 30 entregadores
- [x] Garantir que cada entregador receba no maximo um pedido
- [x] Garantir que pedidos sem entregador suficiente aparecam como nao atribuidos
- [x] Garantir que pedidos fora de `ready` nao entrem no processo
- [x] Garantir que entregadores inativos ou ocupados nao entrem no processo
- [x] Medir `executionTimeMs` com granularidade suficiente para observabilidade basica
- [x] Documentar no codigo e em `DECISIONS.md` por que a abordagem escolhida atende ao desafio
- [x] Definir se a API apenas sugere atribuicoes ou se tambem suporta aplicacao em lote em etapa separada

### Stage 3 - Backend reports and aggregations

Objetivo: transformar dados historicos de pedidos em endpoints de analytics consistentes e consumiveis pelo frontend.

Checklist:

- [x] Implementar `GET /api/reports/revenue` com filtro opcional por `startDate` e `endDate`
- [x] Retornar `totalRevenue`, `totalOrders`, `averageOrderValue`, `startDate`, `endDate` e `dailyRevenue` coerentes com o contrato
- [x] Implementar `GET /api/reports/orders-by-status` com agrupamento por status e campo `total`
- [x] Implementar `GET /api/reports/top-products` considerando apenas pedidos `delivered`
- [x] Respeitar limite padrao e limite maximo para top produtos, se previsto no contrato
- [x] Implementar `GET /api/reports/average-delivery-time` usando `deliveredAt`, incluindo `averageMinutes`, `fastestMinutes`, `slowestMinutes`, `totalDelivered` e `byVehicleType`
- [x] Garantir tratamento correto para periodos sem dados, retornando payload vazio consistente em vez de erro
- [x] Adicionar indices ou ajustes de query caso os acessos de analytics mostrem gargalos claros

### Stage 4 - Frontend reports dashboard

Objetivo: substituir o placeholder atual por uma experiencia analitica real e legivel.

Checklist:

- [x] Rota protegida `/reports` registrada
- [x] Criar `frontend/src/features/reports` com tipos e funcoes de API para todos os endpoints analiticos
- [x] Substituir `frontend/src/pages/reports-page.tsx` por implementacao real
- [x] Implementar filtros opcionais de periodo compartilhados entre os paineis
- [x] Exibir pelo menos dois graficos reais, por exemplo receita por dia e pedidos por status
- [x] Exibir metricas resumo para receita, tempo medio de entrega e volume de pedidos
- [x] Implementar loading state para o carregamento inicial e para refetch por filtro
- [x] Implementar error state com mensagem acionavel
- [x] Implementar empty state quando o periodo filtrado nao tiver dados
- [x] Garantir responsividade adequada para desktop e mobile

### Stage 5 - Frontend optimization experience

Objetivo: levar a sugestao automatizada para o fluxo operacional sem quebrar a clareza da tela de pedidos.

Checklist:

- [x] Criar tipos e funcoes de API para `POST /api/orders/optimize-assignment`
- [x] Definir se a experiencia entra na pagina de pedidos existente ou em uma visao dedicada
- [x] Exibir sugestoes com pedido, entregador recomendado e distancia estimada
- [x] Exibir pedidos nao atribuidos quando a demanda exceder a oferta
- [x] Exibir distancia total estimada da solucao
- [x] Permitir aceitar sugestoes de forma individual ou em lote, conforme a decisao de produto adotada
- [x] Reaproveitar o fluxo de atribuicao manual da sprint 04 quando a sugestao precisar ser efetivada
- [x] Atualizar a UI apos aceite de sugestao sem exigir reload manual
- [x] Tratar erros de conflito operacional quando a disponibilidade mudar entre a sugestao e a confirmacao

### Stage 6 - QA, evidence and delivery proof

Objetivo: sair de modulo placeholder para sprint comprovadamente entregue.

Checklist:

- [x] Adicionar no minimo 2 testes backend para optimization cobrindo caso balanceado e caso sem entregadores suficientes
- [x] Adicionar teste backend para garantir que entregador ocupado ou inativo nao participa da otimizacao
- [x] Adicionar no minimo 2 testes backend para reports cobrindo filtros de periodo e regra de `delivered` em top products
- [x] Adicionar testes HTTP ou e2e cobrindo contrato de optimization e relatorios
- [x] Adicionar testes frontend para renderizacao do dashboard
- [x] Adicionar testes frontend para interacao com filtros de periodo
- [x] Adicionar teste frontend para fluxo de carregar sugestoes de atribuicao
- [ ] Validar manualmente o dashboard e a tela de sugestoes com seed real
- [x] Atualizar `DECISIONS.md` e instrucoes operacionais se o fluxo exigir observacoes especificas

## Expected Deliverables

- endpoint backend de otimizacao com sugestoes, nao atribuicoes e metadados de execucao
- endpoints backend de relatorio aderentes ao contrato e as regras de negocio do desafio
- dashboard frontend real substituindo o placeholder de relatorios
- experiencia frontend para visualizar e aplicar sugestoes de atribuicao otimizada
- documentacao da abordagem algoritmica em `DECISIONS.md`
- testes backend e frontend cobrindo os cenarios principais desta sprint

## Explicit Non-Goals of Sprint 05

Os itens abaixo nao devem ser reabertos como foco principal desta sprint, exceto quando precisarem de pequenos ajustes de integracao:

- reimplementar o CRUD de produtos
- reimplementar o CRUD de entregadores
- reabrir a state machine base de pedidos fora de bugs encontrados durante a integracao
- redesenhar autenticacao, guards, rate limiting ou shape padrao de erro

Esses fundamentos pertencem principalmente aos sprints 02, 03 e 04 e devem ser consumidos como base.

## Dependencies

- Sprint 04 concluida com pedidos funcionais, state machine estrita e atribuicao manual operacional
- Sprint 03 concluida com produtos e entregadores operacionais
- `docs/api-spec.md`
- `docs/database-schema.md`
- `DECISIONS.md`
- `seed/data.json`

## Acceptance Criteria

No estado atual do repositorio, os criterios abaixo estao concluidos do ponto de vista de implementacao e cobertura automatizada:

- [x] `POST /api/orders/optimize-assignment` usa a formula de Haversine para calcular distancias
- [x] a estrategia de matching nao usa brute force `O(n!)` para tamanhos nao triviais
- [x] cada entregador recebe no maximo um pedido na resposta de otimizacao
- [x] pedidos sem capacidade de atendimento aparecem explicitamente como nao atribuidos
- [x] entregadores inativos ou ocupados nao entram na otimizacao
- [x] `GET /api/reports/revenue` respeita os filtros opcionais de periodo e retorna agregacao coerente
- [x] `GET /api/reports/orders-by-status` reflete corretamente os status persistidos
- [x] `GET /api/reports/top-products` considera apenas pedidos `delivered`
- [x] `GET /api/reports/average-delivery-time` usa `deliveredAt` e retorna media correta
- [x] o frontend substitui o placeholder atual por um dashboard responsivo com loading, erro e vazio
- [x] o frontend exibe sugestoes de atribuicao otimizada e permite operacionalizar o resultado com clareza

## Remaining Risk

Os principais riscos que sobraram depois da implementacao sao operacionais, nao de escopo:

- a prova manual com o seed real ainda precisa ser executada em ambiente rodando fim a fim
- o `lint` completo do monorepo segue bloqueado por passivo anterior de formatacao em arquivos fora da sprint 05
