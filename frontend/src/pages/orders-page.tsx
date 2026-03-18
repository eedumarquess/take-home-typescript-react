import { ModulePlaceholder } from '../components/module-placeholder';

export function OrdersPage() {
  return (
    <ModulePlaceholder
      callout="Conectar listagem, detalhe, transicoes de status e atribuicao de entregadores com o contrato oficial."
      checklist={[
        'Tela placeholder com foco em fluxo operacional e lifecycle.',
        'Estrutura pronta para filtros por status, data e ordenacao.',
        'Boundary reservado para validacoes de transicao e eventos de status.',
      ]}
      contract={[
        'GET /api/orders com paginacao, status, startDate, endDate, sortBy e sortOrder.',
        'PATCH /api/orders/:id/status deve respeitar a matriz valida de transicoes.',
        'PATCH /api/orders/:id/assign so pode operar em pedidos ready.',
      ]}
      eyebrow="Operacao"
      summary="Pedidos sao o centro da plataforma. Nesta sprint, a tela deixa claro o encadeamento do dominio sem antecipar a implementacao final."
      title="Pedidos"
    />
  );
}
