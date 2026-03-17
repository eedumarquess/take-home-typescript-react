# Sprint 03 - Products and Delivery Persons

## Sprint Goal

Entregar os dominios CRUD de catalogo e frota com contratos REST estaveis e interfaces administrativas utilizaveis.

## Concept Focus

Products e delivery persons, cobrindo persistencia, regras de negocio, filtros operacionais e fluxo CRUD no frontend.

## Tasks / Stories

- `[Backend]` Implementar list/detail/create/update/delete de produtos com paginacao, busca, filtros e ordenacao.
- `[Backend]` Aplicar regra de `PRODUCT_IN_USE` para delete e preservar visibilidade administrativa de indisponiveis.
- `[Backend]` Implementar list/create/update/delete de entregadores com filtros `isActive` e `available`.
- `[Backend]` Aplicar regra de bloqueio de exclusao para entregador vinculado a pedido `delivering`.
- `[Frontend]` Construir tela de produtos com tabela, busca, formulario create/edit, toggle de disponibilidade e confirmacao de delete.
- `[Frontend]` Construir tela de entregadores com listagem, filtros e formularios administrativos.
- `[QA]` Cobrir CRUD, validacao, conflitos e interacoes principais da UI.

## Expected Deliverables

- APIs estaveis de produtos e entregadores, alinhadas ao contrato.
- Regras de conflito e filtros operacionais implementados no backend.
- Telas administrativas funcionais para gestao de catalogo e frota.
- Testes cobrindo cenarios principais de CRUD e validacao.

## Dependencies

- Sprint 02 concluida com autenticacao, autorizacao e validacao compartilhada ativas.

## Acceptance Criteria

- Produtos suportam paginação, busca, filtros de categoria/disponibilidade e ordenacao.
- Entregadores suportam filtros por atividade e disponibilidade.
- Exclusoes bloqueadas retornam erros padronizados nos cenarios previstos.
- As interfaces frontend permitem criar, editar, listar e excluir com feedback claro ao usuario.
