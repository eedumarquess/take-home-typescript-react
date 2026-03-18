import { type FormEvent, startTransition, useEffect, useState } from 'react';
import { useAuth } from '../features/auth/auth-context';
import { listDeliveryPersons } from '../features/delivery-persons/api';
import type { DeliveryPerson } from '../features/delivery-persons/types';
import {
  assignDeliveryPerson,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from '../features/orders/api';
import type { CreateOrderInput, Order, OrderStatus } from '../features/orders/types';
import { listProducts } from '../features/products/api';
import type { Product } from '../features/products/types';
import { ApiError } from '../services/api';

type OrderDraftItem = {
  id: string;
  productId: string;
  quantity: string;
};

type OrderFormState = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: string;
  longitude: string;
  items: OrderDraftItem[];
};

type FeedbackState = {
  tone: 'error' | 'success';
  text: string;
} | null;

const emptyDraft: OrderFormState = {
  customerName: '',
  customerPhone: '',
  deliveryAddress: '',
  items: [createDraftItem()],
  latitude: '',
  longitude: '',
};

const statusOptions: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Delivering', value: 'delivering' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const sortOptions: Array<{ label: string; value: 'createdAt' | 'totalAmount' }> = [
  { label: 'Mais recentes', value: 'createdAt' },
  { label: 'Valor total', value: 'totalAmount' },
];

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  delivering: 'Delivering',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const actionLabel: Record<OrderStatus, string> = {
  pending: 'Voltar para pending',
  preparing: 'Iniciar preparo',
  ready: 'Marcar como ready',
  delivering: 'Iniciar entrega',
  delivered: 'Concluir entrega',
  cancelled: 'Cancelar pedido',
};

export function OrdersPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin';
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [panelMode, setPanelMode] = useState<'detail' | 'create'>('detail');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [draft, setDraft] = useState<OrderFormState>(emptyDraft);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
  const [pagination, setPagination] = useState({
    limit: 20,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isDeliveryPersonsLoading, setIsDeliveryPersonsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    const reloadToken = refreshNonce;

    async function run() {
      if (reloadToken < 0) {
        return;
      }

      setIsListLoading(true);
      setListError(null);

      try {
        const response = await listOrders({
          endDate: endDate || undefined,
          page,
          sortBy,
          sortOrder,
          startDate: startDate || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        setOrders(response.data);
        setPagination(response.pagination);
      } catch (error) {
        setOrders([]);
        setPagination((current) => ({ ...current, total: 0, totalPages: 0 }));
        setListError(toOrderErrorMessage(error, 'Nao foi possivel carregar os pedidos.'));
      } finally {
        setIsListLoading(false);
      }
    }

    void run();
  }, [endDate, page, refreshNonce, sortBy, sortOrder, startDate, statusFilter]);

  useEffect(() => {
    if (!canWrite) {
      return;
    }

    async function run() {
      setIsProductsLoading(true);

      try {
        const response = await listProducts({
          isAvailable: true,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        });
        setProducts(response.data);
      } catch {
        setProducts([]);
      } finally {
        setIsProductsLoading(false);
      }
    }

    void run();
  }, [canWrite]);

  useEffect(() => {
    setSelectedDeliveryPersonId(selectedOrder?.deliveryPerson?.id ?? '');
  }, [selectedOrder]);

  useEffect(() => {
    if (!canWrite || panelMode !== 'detail' || selectedOrder?.status !== 'ready') {
      setDeliveryPersons([]);
      return;
    }

    const reloadToken = refreshNonce;
    const selectedOrderIdSnapshot = selectedOrder.id;

    async function run() {
      if (reloadToken < 0 || !selectedOrderIdSnapshot) {
        return;
      }

      setIsDeliveryPersonsLoading(true);

      try {
        const response = await listDeliveryPersons({
          available: true,
          isActive: true,
        });
        setDeliveryPersons(response.data);
      } catch {
        setDeliveryPersons([]);
      } finally {
        setIsDeliveryPersonsLoading(false);
      }
    }

    void run();
  }, [canWrite, panelMode, refreshNonce, selectedOrder?.id, selectedOrder?.status]);

  async function handleOpenOrder(orderId: string) {
    setPanelMode('detail');
    setSelectedOrderId(orderId);
    setFeedback(null);
    setIsDetailLoading(true);

    try {
      setSelectedOrder(await getOrder(orderId));
    } catch (error) {
      setSelectedOrder(null);
      setFeedback({
        text: toOrderErrorMessage(error, 'Nao foi possivel carregar o detalhe do pedido.'),
        tone: 'error',
      });
    } finally {
      setIsDetailLoading(false);
    }
  }

  function handleStartCreate() {
    if (!canWrite) {
      return;
    }

    setPanelMode('create');
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDraft(emptyDraft);
    setFeedback(null);
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateDraft(draft);

    if (validationMessage) {
      setFeedback({
        text: validationMessage,
        tone: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const createdOrder = await createOrder(toCreateOrderPayload(draft));
      setPanelMode('detail');
      setSelectedOrderId(createdOrder.id);
      setSelectedOrder(createdOrder);
      setDraft(emptyDraft);
      setFeedback({
        text: 'Pedido criado com sucesso.',
        tone: 'success',
      });
      startTransition(() => {
        setPage(1);
      });
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setFeedback({
        text: toOrderErrorMessage(error, 'Nao foi possivel criar o pedido.'),
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusUpdate(status: OrderStatus) {
    if (!selectedOrderId) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedOrder = await updateOrderStatus(selectedOrderId, status);
      setSelectedOrder(updatedOrder);
      setFeedback({
        text: `Pedido atualizado para ${statusLabel[status]}.`,
        tone: 'success',
      });
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setFeedback({
        text: toOrderErrorMessage(error, 'Nao foi possivel atualizar o status do pedido.'),
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignDeliveryPerson() {
    if (!selectedOrderId || !selectedDeliveryPersonId) {
      setFeedback({
        text: 'Selecione um entregador para concluir a atribuicao.',
        tone: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedOrder = await assignDeliveryPerson(selectedOrderId, selectedDeliveryPersonId);
      setSelectedOrder(updatedOrder);
      setFeedback({
        text: 'Entregador atribuido com sucesso.',
        tone: 'success',
      });
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setFeedback({
        text: toOrderErrorMessage(error, 'Nao foi possivel atribuir o entregador.'),
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const openReadyOrders = orders.filter((order) => order.status === 'ready').length;
  const deliveringOrders = orders.filter((order) => order.status === 'delivering').length;

  return (
    <section className="page admin-page">
      <header className="page-header admin-page__hero">
        <div>
          <p className="page-header__eyebrow">Operacao de pedidos</p>
          <h1>Lifecycle estrito, atribuicao manual e contexto operacional na mesma vista.</h1>
          <p className="page-header__summary">
            A tela espelha o contrato oficial da API para criacao, acompanhamento e transicoes de
            status, com modo leitura preservado para `viewer`.
          </p>
        </div>

        <div className="hero-strip">
          <article className="hero-strip__item">
            <span>Pedidos nesta pagina</span>
            <strong>{orders.length}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Prontos para entrega</span>
            <strong>{openReadyOrders}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Em rota</span>
            <strong>{deliveringOrders}</strong>
          </article>
        </div>
      </header>

      <div className="admin-layout">
        <section className="sheet admin-main">
          <div className="admin-toolbar">
            <div className="admin-toolbar__group">
              <label className="field">
                <span>Status</span>
                <select
                  onChange={(event) => {
                    setStatusFilter(event.target.value as OrderStatus | 'all');
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  value={statusFilter}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Inicio</span>
                <input
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  type="date"
                  value={startDate}
                />
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Fim</span>
                <input
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  type="date"
                  value={endDate}
                />
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Ordenar por</span>
                <select
                  onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                  value={sortBy}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-toolbar__group admin-toolbar__group--compact">
              <label className="field">
                <span>Ordem</span>
                <select
                  onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
                  value={sortOrder}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </label>
            </div>
          </div>

          <div className="table-shell">
            {listError ? (
              <div className="empty-state empty-state--error" role="alert">
                <strong>Falha ao carregar os pedidos.</strong>
                <p>{listError}</p>
              </div>
            ) : isListLoading ? (
              <div className="empty-state">
                <strong>Sincronizando operacao.</strong>
                <p>Carregando pedidos, filtros e pagina atual.</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhum pedido encontrado.</strong>
                <p>Ajuste os filtros para reenquadrar a fila operacional.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Entregador</th>
                    <th>Criado em</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="data-table__title">
                          <strong>{order.customerName}</strong>
                          <p>{order.customerPhone}</p>
                        </div>
                      </td>
                      <td>{summarizeItems(order)}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className={getStatusClassName(order.status)}>
                          {statusLabel[order.status]}
                        </span>
                      </td>
                      <td>{order.deliveryPerson?.name ?? 'Sem atribuicao'}</td>
                      <td>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <button
                          className="button button--ghost button--small"
                          onClick={() => {
                            void handleOpenOrder(order.id);
                          }}
                          type="button"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className="pagination-bar">
            <div>
              <strong>
                Pagina {pagination.page} de {Math.max(pagination.totalPages, 1)}
              </strong>
              <p>{pagination.total} pedidos no total</p>
            </div>

            <div className="pagination-bar__actions">
              <button
                className="button button--ghost button--small"
                disabled={page <= 1 || isListLoading}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                Anterior
              </button>
              <button
                className="button button--ghost button--small"
                disabled={
                  pagination.totalPages === 0 || page >= pagination.totalPages || isListLoading
                }
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Proxima
              </button>
            </div>
          </footer>
        </section>
        <aside className="callout admin-side">
          <div className="callout__cluster">
            <p className="callout__eyebrow">Painel operacional</p>
            <strong>
              {panelMode === 'create'
                ? 'Novo pedido com total calculado pelo backend.'
                : canWrite
                  ? 'Detalhe, atribuicao e transicoes com guardrails de dominio.'
                  : 'Modo somente leitura para acompanhamento.'}
            </strong>
            <p>
              {canWrite
                ? 'O fluxo respeita a state machine oficial: criar, preparar, liberar, atribuir e concluir sem atalhos.'
                : 'Voce pode filtrar, abrir e auditar pedidos, mas a escrita continua reservada ao perfil admin.'}
            </p>
          </div>

          {feedback ? (
            <div
              className={
                feedback.tone === 'success'
                  ? 'inline-feedback inline-feedback--success'
                  : 'inline-feedback inline-feedback--error'
              }
              role="alert"
            >
              {feedback.text}
            </div>
          ) : null}

          {canWrite ? (
            <div className="panel-actions">
              <button className="button" onClick={handleStartCreate} type="button">
                Novo pedido
              </button>
              <span className="panel-actions__hint">
                {panelMode === 'create'
                  ? 'Cadastro em andamento'
                  : selectedOrderId
                    ? 'Pedido selecionado'
                    : 'Selecione um pedido'}
              </span>
            </div>
          ) : null}

          {panelMode === 'create' && canWrite ? (
            <form className="editor-form" onSubmit={(event) => void handleCreateOrder(event)}>
              <label className="field">
                <span>Cliente</span>
                <input
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, customerName: event.target.value }))
                  }
                  value={draft.customerName}
                />
              </label>

              <label className="field">
                <span>Telefone</span>
                <input
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, customerPhone: event.target.value }))
                  }
                  placeholder="(11) 99876-5432"
                  value={draft.customerPhone}
                />
              </label>

              <label className="field">
                <span>Endereco</span>
                <textarea
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, deliveryAddress: event.target.value }))
                  }
                  rows={4}
                  value={draft.deliveryAddress}
                />
              </label>

              <div className="editor-form__grid">
                <label className="field">
                  <span>Latitude</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, latitude: event.target.value }))
                    }
                    placeholder="-23.55050000"
                    value={draft.latitude}
                  />
                </label>

                <label className="field">
                  <span>Longitude</span>
                  <input
                    inputMode="decimal"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, longitude: event.target.value }))
                    }
                    placeholder="-46.63330000"
                    value={draft.longitude}
                  />
                </label>
              </div>

              <div className="order-builder">
                <div className="order-builder__header">
                  <strong>Itens do pedido</strong>
                  <button
                    className="button button--ghost button--small"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        items: [...current.items, createDraftItem()],
                      }));
                    }}
                    type="button"
                  >
                    Adicionar item
                  </button>
                </div>

                {isProductsLoading ? (
                  <div className="empty-state">
                    <strong>Buscando catalogo disponivel.</strong>
                    <p>Somente produtos aceitos em novos pedidos aparecem aqui.</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="empty-state">
                    <strong>Nenhum produto disponivel no momento.</strong>
                    <p>Ative itens no catalogo para criar novos pedidos.</p>
                  </div>
                ) : (
                  <div className="order-builder__rows">
                    {draft.items.map((item, index) => (
                      <div className="order-builder__row" key={item.id}>
                        <label className="field">
                          <span>Produto</span>
                          <select
                            aria-label={`Produto ${index + 1}`}
                            onChange={(event) => {
                              const nextProductId = event.target.value;
                              setDraft((current) => ({
                                ...current,
                                items: current.items.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? { ...entry, productId: nextProductId }
                                    : entry,
                                ),
                              }));
                            }}
                            value={item.productId}
                          >
                            <option value="">Selecione</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field">
                          <span>Quantidade</span>
                          <input
                            aria-label={`Quantidade ${index + 1}`}
                            inputMode="numeric"
                            onChange={(event) => {
                              const nextQuantity = event.target.value;
                              setDraft((current) => ({
                                ...current,
                                items: current.items.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? { ...entry, quantity: nextQuantity }
                                    : entry,
                                ),
                              }));
                            }}
                            value={item.quantity}
                          />
                        </label>

                        <div className="order-builder__actions">
                          <button
                            className="button button--ghost button--small"
                            disabled={draft.items.length === 1}
                            onClick={() => {
                              setDraft((current) => ({
                                ...current,
                                items: current.items.filter((_, itemIndex) => itemIndex !== index),
                              }));
                            }}
                            type="button"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="editor-form__actions">
                <button
                  className="button"
                  disabled={isSubmitting || isProductsLoading}
                  type="submit"
                >
                  {isSubmitting ? 'Criando...' : 'Criar pedido'}
                </button>
              </div>
            </form>
          ) : isDetailLoading ? (
            <div className="empty-state">
              <strong>Carregando detalhe do pedido.</strong>
              <p>Sincronizando itens, entregador e timestamps com o backend.</p>
            </div>
          ) : selectedOrder ? (
            <div className="detail-stack">
              <div className="detail-card">
                <span className={getStatusClassName(selectedOrder.status)}>
                  {statusLabel[selectedOrder.status]}
                </span>
                <h2>{selectedOrder.customerName}</h2>
                <p>{selectedOrder.customerPhone}</p>
              </div>

              <div className="detail-card">
                <strong>Entrega</strong>
                <p>{selectedOrder.deliveryAddress}</p>
                <p>
                  {selectedOrder.latitude.toFixed(6)}, {selectedOrder.longitude.toFixed(6)}
                </p>
              </div>

              <div className="detail-card">
                <strong>Itens</strong>
                <ul className="detail-list">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.product.name} - {formatCurrency(item.unitPrice)}
                    </li>
                  ))}
                </ul>
                <p>Total: {formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              <div className="detail-card">
                <strong>Entregador</strong>
                <p>{selectedOrder.deliveryPerson?.name ?? 'Sem atribuicao'}</p>
                {selectedOrder.deliveryPerson ? (
                  <p>
                    {selectedOrder.deliveryPerson.phone} -{' '}
                    {selectedOrder.deliveryPerson.vehicleType}
                  </p>
                ) : null}
              </div>

              <div className="detail-card">
                <strong>Timestamps</strong>
                <p>Criado em: {formatDateTime(selectedOrder.createdAt)}</p>
                <p>Atualizado em: {formatDateTime(selectedOrder.updatedAt)}</p>
                <p>
                  Entregue em:{' '}
                  {selectedOrder.deliveredAt
                    ? formatDateTime(selectedOrder.deliveredAt)
                    : 'Ainda nao entregue'}
                </p>
              </div>

              {canWrite ? (
                <>
                  {selectedOrder.status === 'ready' ? (
                    <div className="detail-card">
                      <strong>Atribuicao manual</strong>
                      {isDeliveryPersonsLoading ? (
                        <p>Buscando entregadores ativos e disponiveis.</p>
                      ) : (
                        <>
                          <label className="field">
                            <span>Entregador</span>
                            <select
                              onChange={(event) => setSelectedDeliveryPersonId(event.target.value)}
                              value={selectedDeliveryPersonId}
                            >
                              <option value="">Selecione um entregador</option>
                              {deliveryPersons.map((deliveryPerson) => (
                                <option key={deliveryPerson.id} value={deliveryPerson.id}>
                                  {deliveryPerson.name} - {deliveryPerson.vehicleType}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="editor-form__actions">
                            <button
                              className="button button--ghost button--small"
                              disabled={isSubmitting || isDeliveryPersonsLoading}
                              onClick={() => {
                                void handleAssignDeliveryPerson();
                              }}
                              type="button"
                            >
                              {isSubmitting ? 'Salvando...' : 'Atribuir entregador'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  <div className="detail-card">
                    <strong>Proximas acoes</strong>
                    <div className="detail-actions">
                      {getNextStatuses(selectedOrder).length === 0 ? (
                        <p>Este pedido nao possui novas transicoes disponiveis.</p>
                      ) : (
                        getNextStatuses(selectedOrder).map((status) => (
                          <button
                            key={status}
                            className="button button--ghost button--small"
                            disabled={
                              isSubmitting ||
                              (status === 'delivering' && !selectedOrder.deliveryPerson)
                            }
                            onClick={() => {
                              void handleStatusUpdate(status);
                            }}
                            type="button"
                          >
                            {actionLabel[status]}
                          </button>
                        ))
                      )}
                    </div>
                    {selectedOrder.status === 'ready' && !selectedOrder.deliveryPerson ? (
                      <p>Atribua um entregador antes de iniciar a entrega.</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <strong>Modo somente leitura.</strong>
                  <p>As transicoes de status e atribuicoes ficam disponiveis apenas para admin.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Selecione um pedido para ver os detalhes.</strong>
              <p>
                {canWrite
                  ? 'Ou abra o fluxo de criacao para registrar um novo pedido.'
                  : 'Os detalhes aparecem aqui sem liberar acoes de escrita.'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function getNextStatuses(order: Order): OrderStatus[] {
  switch (order.status) {
    case 'pending':
      return ['preparing', 'cancelled'];
    case 'preparing':
      return ['ready', 'cancelled'];
    case 'ready':
      return ['delivering', 'cancelled'];
    case 'delivering':
      return ['delivered'];
    default:
      return [];
  }
}

function getStatusClassName(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'status-pill status-pill--neutral';
    case 'preparing':
      return 'status-pill status-pill--warning';
    case 'ready':
      return 'status-pill status-pill--info';
    case 'delivering':
      return 'status-pill status-pill--accent';
    case 'delivered':
      return 'status-pill status-pill--success';
    case 'cancelled':
      return 'status-pill status-pill--danger';
  }
}

function summarizeItems(order: Order) {
  return order.items.map((item) => `${item.quantity}x ${item.product.name}`).join(', ');
}

function validateDraft(draft: OrderFormState) {
  const customerName = draft.customerName.trim();
  const customerPhone = draft.customerPhone.trim();
  const deliveryAddress = draft.deliveryAddress.trim();
  const latitude = Number(draft.latitude);
  const longitude = Number(draft.longitude);

  if (customerName.length < 3 || customerName.length > 100) {
    return 'O nome do cliente deve ter entre 3 e 100 caracteres.';
  }

  if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(customerPhone)) {
    return 'O telefone deve seguir o formato (11) 91234-5678.';
  }

  if (deliveryAddress.length < 10 || deliveryAddress.length > 300) {
    return 'O endereco de entrega deve ter entre 10 e 300 caracteres.';
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return 'A latitude deve estar entre -90 e 90.';
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return 'A longitude deve estar entre -180 e 180.';
  }

  if (draft.items.length === 0) {
    return 'Adicione ao menos um item ao pedido.';
  }

  for (const item of draft.items) {
    const quantity = Number(item.quantity);

    if (!item.productId) {
      return 'Selecione um produto para cada item do pedido.';
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return 'Cada item deve ter uma quantidade inteira maior que zero.';
    }
  }

  return null;
}

function toCreateOrderPayload(draft: OrderFormState): CreateOrderInput {
  return {
    customerName: draft.customerName.trim(),
    customerPhone: draft.customerPhone.trim(),
    deliveryAddress: draft.deliveryAddress.trim(),
    items: draft.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    })),
    latitude: Number(draft.latitude),
    longitude: Number(draft.longitude),
  };
}

function createDraftItem(): OrderDraftItem {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `draft-item-${Date.now()}-${Math.random()}`,
    productId: '',
    quantity: '1',
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toOrderErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === 'UNAVAILABLE_PRODUCT' && error.details.length > 0) {
      const items = error.details
        .map((detail) => {
          if (!detail || typeof detail !== 'object') {
            return null;
          }

          const reason = 'reason' in detail ? String(detail.reason) : null;
          const productName =
            'productName' in detail && detail.productName ? String(detail.productName) : null;
          const productId = 'productId' in detail ? String(detail.productId) : null;

          return productName ?? productId ?? reason;
        })
        .filter(Boolean);

      return items.length > 0 ? `${error.message}: ${items.join(', ')}` : error.message;
    }

    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}
