import { ModulePlaceholder } from '../components/module-placeholder';

export function DeliveryPersonsPage() {
  return (
    <ModulePlaceholder
      callout="Adicionar CRUD administrativo, filtro de disponibilidade e validacoes de alocacao em andamento."
      checklist={[
        'Tela base para a frota com navegacao protegida.',
        'Espaco preparado para mapa, lista e status de atividade.',
        'Contrato de disponibilidade ja refletido na copy da interface.',
      ]}
      contract={[
        'GET /api/delivery-persons com filtros isActive e available.',
        'Somente admin acessa a gestao de entregadores.',
        'Entregador inativo ou em entrega nao pode ser atribuido novamente.',
      ]}
      eyebrow="Fleet"
      summary="A area de entregadores nasce como extensao do fluxo operacional, pronta para receber disponibilidade em tempo real e recomendacoes de atribuicao."
      title="Entregadores"
    />
  );
}
