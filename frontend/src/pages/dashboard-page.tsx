import { useQueries } from '@tanstack/react-query';
import {
  getAverageDeliveryTimeReport,
  getOrdersByStatusReport,
  getRevenueReport,
} from '../features/reports/api';
import { apiBaseUrl } from '../services/api';
import { formatApiError } from '../services/error-details';

export function DashboardPage() {
  const [revenueQuery, ordersByStatusQuery, averageDeliveryTimeQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'revenue'],
        queryFn: () => getRevenueReport(),
      },
      {
        queryKey: ['dashboard', 'orders-by-status'],
        queryFn: () => getOrdersByStatusReport(),
      },
      {
        queryKey: ['dashboard', 'average-delivery-time'],
        queryFn: () => getAverageDeliveryTimeReport(),
      },
    ],
  });
  const isLoading =
    revenueQuery.isLoading || ordersByStatusQuery.isLoading || averageDeliveryTimeQuery.isLoading;
  const errorMessage =
    revenueQuery.error || ordersByStatusQuery.error || averageDeliveryTimeQuery.error
      ? formatApiError(
          revenueQuery.error ?? ordersByStatusQuery.error ?? averageDeliveryTimeQuery.error,
          'Nao foi possivel carregar o overview operacional.',
        )
      : null;
  const readyOrders =
    ordersByStatusQuery.data?.data.find((entry) => entry.status === 'ready')?.count ?? 0;
  const deliveringOrders =
    ordersByStatusQuery.data?.data.find((entry) => entry.status === 'delivering')?.count ?? 0;
  const deliveredOrders =
    ordersByStatusQuery.data?.data.find((entry) => entry.status === 'delivered')?.count ?? 0;
  const summaryCards = [
    {
      title: 'Receita entregue',
      body: revenueQuery.data
        ? formatCurrency(revenueQuery.data.totalRevenue)
        : isLoading
          ? 'Atualizando...'
          : 'Sem leitura',
    },
    {
      title: 'Pedidos prontos',
      body: String(readyOrders),
    },
    {
      title: 'Tempo medio',
      body: averageDeliveryTimeQuery.data
        ? `${averageDeliveryTimeQuery.data.averageMinutes.toFixed(1)} min`
        : '0 min',
    },
  ];
  const operationalTracks = [
    `${readyOrders} pedidos estao em ready aguardando atribuicao operacional.`,
    `${deliveringOrders} pedidos estao em rota agora.`,
    `${deliveredOrders} pedidos concluidos ja alimentam os relatorios de receita.`,
  ];

  return (
    <section className="page page--dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="page-header__eyebrow">Operations Board</p>
          <h1>Central de operacoes pronta para catalogo, fila e distribuicao.</h1>
          <p className="page-header__summary">
            O dashboard agora espelha a operacao real do FastMeals com indicadores vivos de receita,
            fila e performance de entrega puxados do backend.
          </p>
        </div>

        <div className="dashboard-hero__terminal">
          <span>API alvo</span>
          <code>{apiBaseUrl}</code>
        </div>
      </header>

      {errorMessage ? (
        <div className="sheet empty-state empty-state--error" role="alert">
          <strong>Falha ao carregar o overview.</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="dashboard-grid">
        {summaryCards.map((card) => (
          <article key={card.title} className="sheet">
            <p className="sheet__eyebrow">Panorama vivo</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--secondary">
        <article className="sheet sheet--wide">
          <p className="sheet__eyebrow">Checklist operacional</p>
          <ul className="sheet__list">
            {operationalTracks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="callout">
          <p className="callout__eyebrow">Leitura rapida</p>
          <strong>
            {isLoading
              ? 'Sincronizando os modulos para montar o quadro operacional.'
              : `${revenueQuery.data?.totalOrders ?? 0} pedidos entregues compoem a leitura atual de receita.`}
          </strong>
        </article>
      </div>
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}
