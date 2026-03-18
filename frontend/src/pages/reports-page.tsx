import {
  type CSSProperties,
  type FormEvent,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getAverageDeliveryTimeReport,
  getOrdersByStatusReport,
  getRevenueReport,
  getTopProductsReport,
} from '../features/reports/api';
import type {
  AverageDeliveryTimeReport,
  OrdersByStatusReport,
  ReportDateRangeQuery,
  RevenueReport,
  TopProductsReport,
} from '../features/reports/types';
import { ApiError } from '../services/api';

type FiltersState = {
  startDate: string;
  endDate: string;
};

type ReportsDashboardState = {
  averageDeliveryTime: AverageDeliveryTimeReport;
  ordersByStatus: OrdersByStatusReport;
  revenue: RevenueReport;
  topProducts: TopProductsReport;
};

const emptyFilters: FiltersState = {
  endDate: '',
  startDate: '',
};

const statusToneClassName: Record<string, string> = {
  cancelled: 'status-pill status-pill--danger',
  delivered: 'status-pill status-pill--success',
  delivering: 'status-pill status-pill--accent',
  pending: 'status-pill status-pill--neutral',
  preparing: 'status-pill status-pill--warning',
  ready: 'status-pill status-pill--info',
};

export function ReportsPage() {
  const [draftFilters, setDraftFilters] = useState<FiltersState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(emptyFilters);
  const [dashboard, setDashboard] = useState<ReportsDashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const hasLoadedDashboardRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    const requestVersion = reloadNonce;

    async function run() {
      if (requestVersion < 0) {
        return;
      }

      const initialLoad = !hasLoadedDashboardRef.current;

      if (initialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const query = toQuery(appliedFilters);
        const [revenue, ordersByStatus, topProducts, averageDeliveryTime] = await Promise.all([
          getRevenueReport(query),
          getOrdersByStatusReport(query),
          getTopProductsReport({ ...query, limit: 10 }),
          getAverageDeliveryTimeReport(query),
        ]);

        if (!isActive) {
          return;
        }

        setDashboard({
          averageDeliveryTime,
          ordersByStatus,
          revenue,
          topProducts,
        });
        hasLoadedDashboardRef.current = true;
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        setError(toReportsErrorMessage(requestError, 'Nao foi possivel carregar os relatorios.'));
        hasLoadedDashboardRef.current = true;
      } finally {
        if (isActive) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void run();

    return () => {
      isActive = false;
    };
  }, [appliedFilters, reloadNonce]);

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      setAppliedFilters(draftFilters);
    });
  }

  function handleResetFilters() {
    setDraftFilters(emptyFilters);
    startTransition(() => {
      setAppliedFilters(emptyFilters);
    });
  }

  const isEmpty =
    dashboard !== null &&
    dashboard.revenue.totalOrders === 0 &&
    dashboard.ordersByStatus.total === 0 &&
    dashboard.topProducts.data.length === 0 &&
    dashboard.averageDeliveryTime.totalDelivered === 0;

  return (
    <section className="page reports-page">
      <header className="page-header reports-hero">
        <div className="reports-hero__copy">
          <p className="page-header__eyebrow">Analytics operacional</p>
          <h1>Receita entregue, gargalos do fluxo e alocacao da frota na mesma leitura.</h1>
          <p className="page-header__summary">
            O dashboard cruza pedidos entregues, distribuicao de status e tempo de entrega sem
            depender de export manual. O recorte pode ser reaplicado sem trocar de tela.
          </p>
        </div>

        <aside className="reports-band">
          <span>Recorte atual</span>
          <strong>
            {isRefreshing ? 'Refinando recorte...' : describeAppliedPeriod(appliedFilters)}
          </strong>
          <p>
            {dashboard
              ? `${dashboard.revenue.totalOrders} pedidos entregues no intervalo atual`
              : 'Aguardando a primeira leitura analitica'}
          </p>
        </aside>
      </header>

      <form className="sheet reports-filter-bar" onSubmit={handleApplyFilters}>
        <label className="field">
          <span>Inicio</span>
          <input
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, startDate: event.target.value }))
            }
            type="date"
            value={draftFilters.startDate}
          />
        </label>

        <label className="field">
          <span>Fim</span>
          <input
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, endDate: event.target.value }))
            }
            type="date"
            value={draftFilters.endDate}
          />
        </label>

        <div className="reports-filter-bar__actions">
          <button className="button" disabled={isLoading || isRefreshing} type="submit">
            {isRefreshing ? 'Atualizando...' : 'Aplicar recorte'}
          </button>
          <button
            className="button button--ghost"
            disabled={isLoading || isRefreshing}
            onClick={handleResetFilters}
            type="button"
          >
            Limpar
          </button>
        </div>
      </form>

      {error && dashboard === null ? (
        <div className="sheet empty-state empty-state--error" role="alert">
          <strong>Falha ao montar o painel analitico.</strong>
          <p>{error}</p>
          <button
            className="button button--ghost button--small"
            onClick={() => setReloadNonce((current) => current + 1)}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : isLoading || dashboard === null ? (
        <div className="sheet empty-state">
          <strong>Consolidando receitas, status e tempos de entrega.</strong>
          <p>
            O painel busca todos os endpoints de analytics em paralelo antes de desenhar a vista.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="sheet empty-state">
          <strong>Nenhum dado analitico para o recorte atual.</strong>
          <p>Expanda o periodo para recuperar pedidos entregues, status e ranking de produtos.</p>
        </div>
      ) : (
        <>
          {error ? (
            <div className="inline-feedback inline-feedback--error" role="alert">
              {error}
            </div>
          ) : null}

          <section className="reports-summary">
            <article className="sheet reports-summary__primary">
              <p className="sheet__eyebrow">Receita entregue</p>
              <h2>{formatCurrency(dashboard.revenue.totalRevenue)}</h2>
              <p>
                Ticket medio de {formatCurrency(dashboard.revenue.averageOrderValue)} em{' '}
                {dashboard.revenue.totalOrders} pedidos.
              </p>
            </article>

            <article className="sheet">
              <p className="sheet__eyebrow">Tempo medio</p>
              <h2>{formatMinutes(dashboard.averageDeliveryTime.averageMinutes)}</h2>
              <p>
                Melhor rota em {formatMinutes(dashboard.averageDeliveryTime.fastestMinutes)} e pior
                caso em {formatMinutes(dashboard.averageDeliveryTime.slowestMinutes)}.
              </p>
            </article>

            <article className="sheet">
              <p className="sheet__eyebrow">Fila observada</p>
              <h2>{dashboard.ordersByStatus.total}</h2>
              <p>
                Status persistidos no periodo, incluindo pedidos ainda abertos e historico de
                conclusao.
              </p>
            </article>
          </section>

          <section className="reports-grid">
            <article className="sheet reports-panel reports-panel--feature">
              <div className="reports-panel__header">
                <div>
                  <p className="sheet__eyebrow">Receita por dia</p>
                  <h2>Cadencia de entregas faturadas</h2>
                </div>
                <span className="reports-panel__meta">
                  {dashboard.revenue.dailyRevenue.length} pontos no intervalo
                </span>
              </div>
              <RevenueChart data={dashboard.revenue.dailyRevenue} />
            </article>

            <article className="sheet reports-panel">
              <div className="reports-panel__header">
                <div>
                  <p className="sheet__eyebrow">Pedidos por status</p>
                  <h2>Distribuicao operacional</h2>
                </div>
                <span className="reports-panel__meta">
                  {dashboard.ordersByStatus.total} registros
                </span>
              </div>
              <StatusChart data={dashboard.ordersByStatus.data} />
            </article>

            <article className="sheet reports-panel">
              <div className="reports-panel__header">
                <div>
                  <p className="sheet__eyebrow">Top produtos</p>
                  <h2>Itens que mais giram em pedidos delivered</h2>
                </div>
              </div>
              <ol className="reports-ranking">
                {dashboard.topProducts.data.map((product, index) => (
                  <li className="reports-ranking__item" key={product.productId}>
                    <div>
                      <span className="reports-ranking__index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <strong>{product.productName}</strong>
                    </div>
                    <div className="reports-ranking__metrics">
                      <span>{product.totalQuantity} itens</span>
                      <strong>{formatCurrency(product.totalRevenue)}</strong>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="sheet reports-panel">
              <div className="reports-panel__header">
                <div>
                  <p className="sheet__eyebrow">Tempo por veiculo</p>
                  <h2>Frota comparada no mesmo corte</h2>
                </div>
              </div>
              <div className="reports-vehicle-stack">
                {dashboard.averageDeliveryTime.byVehicleType.map((entry) => (
                  <div className="reports-vehicle-row" key={entry.vehicleType}>
                    <div>
                      <strong>{formatVehicleType(entry.vehicleType)}</strong>
                      <p>{entry.count} entregas</p>
                    </div>
                    <strong>{formatMinutes(entry.averageMinutes)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </section>
  );
}

function RevenueChart({ data }: { data: RevenueReport['dailyRevenue'] }) {
  const maxRevenue = Math.max(...data.map((entry) => entry.revenue), 1);

  return (
    <div className="chart-columns" role="img" aria-label="Grafico de receita por dia">
      {data.map((entry) => (
        <div className="chart-columns__item" key={entry.date}>
          <div
            className="chart-columns__bar"
            style={
              {
                '--chart-height': `${Math.max((entry.revenue / maxRevenue) * 100, 8)}%`,
              } as CSSProperties
            }
          />
          <strong>{formatCurrency(entry.revenue)}</strong>
          <span>{formatShortDate(entry.date)}</span>
        </div>
      ))}
    </div>
  );
}

function StatusChart({ data }: { data: OrdersByStatusReport['data'] }) {
  const maxCount = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <div className="chart-bars" role="img" aria-label="Grafico de pedidos por status">
      {data.map((entry) => (
        <div className="chart-bars__row" key={entry.status}>
          <div className="chart-bars__label">
            <span className={statusToneClassName[entry.status]}>{formatStatus(entry.status)}</span>
            <strong>{entry.count}</strong>
          </div>
          <div className="chart-bars__track">
            <div
              className="chart-bars__fill"
              style={
                {
                  '--chart-width': `${(entry.count / maxCount) * 100}%`,
                } as CSSProperties
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function toQuery(filters: FiltersState): ReportDateRangeQuery {
  return {
    endDate: filters.endDate || undefined,
    startDate: filters.startDate || undefined,
  };
}

function describeAppliedPeriod(filters: FiltersState) {
  if (!filters.startDate && !filters.endDate) {
    return 'Periodo completo';
  }

  if (filters.startDate && filters.endDate) {
    return `${formatShortDate(filters.startDate)} ate ${formatShortDate(filters.endDate)}`;
  }

  return filters.startDate
    ? `A partir de ${formatShortDate(filters.startDate)}`
    : `Ate ${formatShortDate(filters.endDate)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

function formatMinutes(value: number) {
  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value)} min`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatStatus(status: string) {
  return status[0].toUpperCase() + status.slice(1);
}

function formatVehicleType(
  vehicleType: AverageDeliveryTimeReport['byVehicleType'][number]['vehicleType'],
) {
  switch (vehicleType) {
    case 'bicycle':
      return 'Bicicleta';
    case 'car':
      return 'Carro';
    case 'motorcycle':
      return 'Moto';
  }
}

function toReportsErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}
