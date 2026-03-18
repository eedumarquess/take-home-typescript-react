import { ModulePlaceholder } from '../components/module-placeholder';

export function ReportsPage() {
  return (
    <ModulePlaceholder
      callout="Conectar charts reais com filtros de periodo e estados de loading, erro e vazio."
      checklist={[
        'Placeholder pronto para os painis analiticos.',
        'Area reservada para pelo menos dois graficos responsivos nas proximas sprints.',
        'Contrato visual alinhado com endpoints de revenue, status, top products e delivery time.',
      ]}
      contract={[
        'Filtros opcionais de startDate e endDate em todos os relatorios.',
        'Top products considera apenas pedidos delivered.',
        'Average delivery time usa deliveredAt com apoio do historico de eventos.',
      ]}
      eyebrow="Analytics"
      summary="Esta pagina fixa a regiao analitica do produto e evita que relatorios virem um apendice improvisado depois."
      title="Relatorios"
    />
  );
}
