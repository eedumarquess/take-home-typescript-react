# Sprint 05 - Optimization and Reports

## Sprint Goal

Entregar os diferenciais algoritmicos e analiticos do case com APIs e telas de apoio a decisao operacional.

## Concept Focus

Optimization service e reporting dashboard, conectando algoritmo de atribuicao, agregacoes analiticas e experiencia visual do dashboard.

## Tasks / Stories

- `[Backend]` Implementar Haversine e matriz de custo entre pedidos `ready` e entregadores disponiveis.
- `[Backend]` Implementar Hungarian algorithm em `POST /api/orders/optimize-assignment`, com `assignments`, `unassigned`, `totalDistanceKm`, `algorithm` e `executionTimeMs`.
- `[Backend]` Implementar relatorios `revenue`, `orders-by-status`, `top-products` e `average-delivery-time` com filtro opcional por periodo.
- `[Frontend]` Construir dashboard de metricas com pelo menos dois graficos e estados de loading, erro e vazio.
- `[Frontend]` Construir tela de sugestao de atribuicao otimizada com aceitar/rejeitar e fluxo `assign` + `status=delivering`.
- `[Docs]` Atualizar `DECISIONS.md` com abordagem do algoritmo, complexidade e trade-offs.
- `[QA]` Cobrir caso com solucao, sem entregadores, desequilibrio entre oferta/demanda e relatorios principais.

## Expected Deliverables

- Endpoint de otimizacao aderente ao contrato do desafio.
- Endpoints de relatorio prontos para consumo pelo dashboard.
- Interface analitica com metricas, graficos e fluxo de aceitacao de sugestoes.
- Documentacao tecnica do algoritmo e seus trade-offs.

## Dependencies

- Sprint 04 concluida com pedidos, status e atribuicao manual em funcionamento.

## Acceptance Criteria

- O calculo de distancia usa a formula de Haversine.
- O endpoint de otimizacao retorna atribuicoes, nao atribuicoes e distancia total conforme esperado.
- Os relatorios respeitam os filtros opcionais por periodo e calculam somente os dados corretos por regra de negocio.
- O fluxo de aceitar sugestao executa `assign` e depois altera o pedido para `delivering`.
