# Sprint 06 - Hardening and Delivery

## Sprint Goal

Fechar qualidade, empacotamento, documentacao e prova final de execucao para transformar o projeto em um pacote realmente pronto para submissao.

## Status

Esta sprint saiu do estado parcial e fechou os artefatos principais de entrega. O repositorio agora foi normalizado para `lint`, ganhou empacotamento Docker completo, recebeu documentacao final por workspace e removeu a copy residual de sprint antiga no frontend.

Hoje, o estado real e este:

- `npm run typecheck` passa no monorepo
- `npm run build` passa no monorepo
- `npm run test` passa no monorepo
- `npm run test:e2e:backend` passa no backend
- o minimo eliminatorio de testes backend e frontend ja foi superado com folga
- `npm run lint` foi destravado por normalizacao global de formatacao e politica explicita de line endings
- `docker-compose.yml` agora modela `postgres + backend-init + backend + frontend`
- `README.md`, `backend/README.md` e `frontend/README.md` foram atualizados para refletir o produto final
- a copy residual de sprint antiga foi removida do shell autenticado, do dashboard e da faixa de relatorios
- a validacao operacional com Docker continua dependente de um daemon ativo no ambiente de execucao; neste ambiente a tentativa de `docker compose up --build -d` falhou porque `dockerDesktopLinuxEngine` nao estava disponivel

## Delivery Log

- [x] Quality baseline: `typecheck`, `build`, `test` e `test:e2e:backend` foram executados com sucesso no estado anterior da sprint.
- [x] Quality revalidation: `lint`, `typecheck`, `build`, `test` e `test:e2e:backend` passaram apos as mudancas desta sprint.
- [x] Test bar: a cobertura minima eliminatoria do desafio ja foi atendida e excedida por testes unitarios, de integracao e de UI.
- [x] Repository audit: as principais lacunas reais de entrega final em lint, Docker, documentacao e polish de frontend foram identificadas.
- [x] Lint closure: o repositorio foi normalizado para fazer `npm run lint` passar sem excecoes manuais.
- [x] Packaging: o ambiente de entrega foi expandido para suportar `backend + frontend + postgres` com um unico fluxo Docker.
- [x] Docs finalization: README raiz e READMEs especificos de backend e frontend foram atualizados.
- [ ] Final proof: executar validacoes manuais e operacionais fim a fim com banco real, seed real e fluxo de runtime documentado.

## Repository Baseline Confirmed

Os seguintes pontos foram verificados no repositorio e devem ser tratados como base existente para esta sprint:

- a raiz do monorepo expoe scripts consolidados de `dev`, `build`, `typecheck`, `test`, `lint` e execucao e2e do backend
- `backend/package.json` contem scripts de `prisma:generate`, `db:push`, `seed`, `build`, `typecheck`, `test` e `test:e2e`
- `frontend/package.json` contem scripts de `dev`, `build`, `typecheck` e `test`
- a cobertura obrigatoria de backend e frontend ja foi excedida
- `DECISIONS.md` registra as escolhas arquiteturais, as regras de auth, os trade-offs de analytics e a abordagem de optimization com Hungarian algorithm
- `backend/prisma/seed.ts` le `seed/data.json` e o backend expoe `npm run seed`
- `docker-compose.yml` provisiona o ambiente completo com `postgres`, job de init, backend e frontend
- o frontend entrega os modulos reais de produtos, pedidos, entregadores e relatorios sem textos remanescentes de sprint antiga nas areas principais

## Repository Gap Summary

Comparando o estado atual do repositorio com o que a sprint 06 precisa entregar, estas sao as lacunas remanescentes:

- falta revalidar operacionalmente `db push`, `seed`, runtime local e runtime via Docker contra PostgreSQL real apos as ultimas mudancas
- falta executar smoke manual final com perfis `admin` e `viewer`, cobrindo login, CRUDs, relatorios, optimize-assignment e expiracao de sessao
- falta registrar a evidencia final de compose em um ambiente com daemon Docker ativo

## Scope of Sprint 06

O escopo desta sprint e fechar o pacote final de entrega sem reabrir o desenvolvimento funcional dos dominios ja implementados:

- consolidar a baseline automatizada de qualidade e destravar o `lint`
- empacotar o projeto para execucao completa via Docker
- atualizar a documentacao operacional e os artefatos de submissao
- polir o frontend para remover sinais de sprint antiga e linguagem de placeholder
- produzir evidencias finais de execucao local, seed, runtime e validacao manual

## Sprint Stories

- `[QA]` Consolidar a baseline final de qualidade, normalizando o repositorio para `lint`, `typecheck`, `build` e `test`.
- `[Platform]` Empacotar backend, frontend e PostgreSQL para execucao via Docker com um unico fluxo de subida.
- `[Docs]` Atualizar README raiz, criar README por workspace e fechar checklist de submissao com evidencias objetivas.
- `[Frontend]` Remover copy residual de sprint antiga e revisar a experiencia final de loading, erro, vazio, roles e expiracao.
- `[Performance]` Validar comportamento perceptivel de listagens e optimization antes de qualquer tuning adicional.
- `[Release]` Fechar a prova final de seed, execucao local e execucao via Docker sem deixar criterio eliminatorio em aberto.

## Execution Stages

### Stage 1 - Quality baseline and lint closure

Checklist:

- [x] Registrar que `npm run typecheck` passa
- [x] Registrar que `npm run build` passa
- [x] Registrar que `npm run test` passa
- [x] Registrar que `npm run test:e2e:backend` passa
- [x] Confirmar que o minimo eliminatorio de testes backend e frontend foi superado
- [x] Fechar `npm run lint` com normalizacao de formatacao Biome no repo inteiro
- [x] Definir politica explicita de line endings para evitar regressao de CRLF e LF
- [x] Revalidar `lint`, `typecheck`, `build` e `test` apos a normalizacao

### Stage 2 - Packaging and runtime delivery

Checklist:

- [x] Adicionar `Dockerfile` do backend
- [x] Adicionar `Dockerfile` do frontend
- [x] Expandir `docker-compose.yml` para `backend + frontend + postgres`
- [x] Garantir healthchecks, dependencias e startup order coerentes
- [ ] Validar `docker compose up --build` como fluxo unico de subida
- [ ] Validar `npm run db:push --workspace backend` contra PostgreSQL real
- [ ] Validar `npm run seed --workspace backend` contra PostgreSQL real
- [ ] Validar backend em `:3001` e frontend em `:3000` no fluxo documentado

### Stage 3 - Documentation and submission artifacts

Checklist:

- [x] Atualizar `README.md` da raiz para refletir o estado final do produto
- [x] Criar `backend/README.md` com setup, env, seed, test e run
- [x] Criar `frontend/README.md` com setup, env, build, test e run
- [x] Atualizar `DECISIONS.md` com decisoes de hardening e empacotamento que surgirem nesta etapa
- [x] Fechar checklist de submissao mapeando criterios eliminatorios para evidencias concretas
- [ ] Revisar se instrucoes de seed, credenciais e runtime estao consistentes entre todos os documentos

### Stage 4 - Frontend final polish

Checklist:

- [x] Remover copy interna de sprint e placeholder remanescente do shell autenticado
- [x] Revisar textos como `Sprint 01`, `bootstrap` e `Radar da sprint 05` para linguagem de produto final
- [ ] Executar smoke manual com `admin` em produtos, pedidos, entregadores e relatorios
- [ ] Executar smoke manual com `viewer` em leitura de produtos, pedidos e relatorios
- [ ] Revalidar loading, erro, vazio, redirect de expiracao e responsividade mobile

### Stage 5 - Performance and final proof

Checklist:

- [ ] Validar performance perceptivel das listagens com a massa real do seed
- [ ] Validar performance perceptivel de `POST /api/orders/optimize-assignment` com a massa real do seed
- [ ] Confirmar que indices e queries atuais sao suficientes antes de introduzir tuning extra
- [ ] Registrar evidencias finais de seed, execucao local e execucao via Docker
- [ ] Encerrar a sprint apenas quando nenhum criterio eliminatorio estiver aberto

## Expected Deliverables

- monorepo com `lint`, `typecheck`, `build` e `test` fechados
- ambiente Docker completo com backend, frontend e PostgreSQL
- README raiz atualizado e README especifico para backend e frontend
- `DECISIONS.md` final refletindo decisoes de entrega e hardening
- frontend polido, sem copy de sprint interna remanescente
- evidencias finais de seed, runtime local, runtime via Docker e smoke manual

## Acceptance Criteria

No estado atual do repositorio, os criterios abaixo ja estao comprovados:

- [x] o projeto passa em `npm run typecheck`
- [x] o projeto passa em `npm run build`
- [x] o projeto passa em `npm run test`
- [x] o backend passa em `npm run test:e2e:backend`
- [x] o projeto passa em `npm run lint`
- [x] o minimo obrigatorio de testes backend e frontend ja foi superado
- [x] existe politica explicita de line endings para impedir regressao de formatacao
- [x] `docker-compose.yml` sobe backend, frontend e banco com um unico fluxo em nivel de artefato e configuracao
- [x] o README da raiz reflete o estado final do produto
- [x] existem `README.md` proprios em `backend/` e `frontend/`
- [x] o frontend nao exibe mais copy de sprint antiga ou linguagem de placeholder

Os criterios abaixo ainda precisam ser fechados para considerar a sprint 06 entregue:

- [ ] `db push` e `seed` foram validados contra PostgreSQL real no fluxo documentado
- [ ] foi executado smoke manual minimo com `admin`, `viewer`, relatorios, optimize-assignment e logout ou expiracao
- [ ] nenhum criterio eliminatorio do desafio permanece sem evidencia de fechamento

## Remaining Risk

Os principais riscos remanescentes desta sprint sao de evidencia operacional, nao mais de empacotamento:

- a validacao manual fim a fim com banco real, seed real e fluxo Docker completo ainda nao foi comprovada
- a verificacao de `docker compose up --build` continua bloqueada neste ambiente enquanto o daemon Docker nao estiver disponivel
- `db push` e `seed` contra PostgreSQL real nao puderam ser revalidados porque nao havia banco escutando em `localhost:5432` e o engine Docker estava indisponivel
