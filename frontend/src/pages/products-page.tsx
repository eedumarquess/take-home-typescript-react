import { ModulePlaceholder } from '../components/module-placeholder';

export function ProductsPage() {
  return (
    <ModulePlaceholder
      callout="Implementar CRUD real, bloqueio de exclusao por pedidos ativos e persistencia com Prisma."
      checklist={[
        'Placeholder navegavel para o modulo de catalogo.',
        'Estrutura pronta para filtros de busca, categoria, disponibilidade e ordenacao.',
        'Area protegida respeitando auth e expiracao de token.',
      ]}
      contract={[
        'GET /api/products com paginacao, search, category, isAvailable, sortBy e sortOrder.',
        'POST/PUT/DELETE reservados para admin.',
        'Produtos indisponiveis continuam visiveis no painel administrativo.',
      ]}
      eyebrow="Catalogo"
      summary="O shell ja assume a linguagem operacional do modulo de produtos e deixa a interface pronta para receber tabela, formularios e estados vazios reais."
      title="Produtos"
    />
  );
}
