import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { useAuth } from '../features/auth/auth-context';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  patchProduct,
  updateProductAvailability,
} from '../features/products/api';
import type { Product, ProductCategory, SaveProductInput } from '../features/products/types';
import { formatApiError } from '../services/error-details';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: string;
};

type FeedbackState = {
  tone: 'error' | 'success';
  text: string;
} | null;

type AvailabilityFilter = 'all' | 'available' | 'unavailable';

const categoryOptions: Array<{ label: string; value: ProductCategory }> = [
  { label: 'Meal', value: 'meal' },
  { label: 'Drink', value: 'drink' },
  { label: 'Dessert', value: 'dessert' },
  { label: 'Side', value: 'side' },
];

const sortOptions: Array<{ label: string; value: 'name' | 'price' | 'createdAt' }> = [
  { label: 'Mais recentes', value: 'createdAt' },
  { label: 'Nome', value: 'name' },
  { label: 'Preco', value: 'price' },
];

const emptyFormState: ProductFormState = {
  category: 'meal',
  description: '',
  imageUrl: '',
  isAvailable: true,
  name: '',
  preparationTime: '15',
  price: '',
};

export function ProductsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin';
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [draft, setDraft] = useState<ProductFormState>(emptyFormState);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const deferredSearch = useDeferredValue(searchInput.trim());
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: [
      'products',
      {
        availabilityFilter,
        categoryFilter,
        deferredSearch,
        page,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      listProducts({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        isAvailable: availabilityFilter === 'all' ? undefined : availabilityFilter === 'available',
        page,
        search: deferredSearch || undefined,
        sortBy,
        sortOrder,
      }),
  });
  const saveMutation = useMutation({
    mutationFn: async (payload: SaveProductInput) =>
      formMode === 'create' || !selectedProductId
        ? createProduct(payload)
        : patchProduct(selectedProductId, payload),
    onSuccess: (savedProduct) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setFeedback({
        text:
          formMode === 'create' ? 'Produto criado com sucesso.' : 'Produto atualizado com sucesso.',
        tone: 'success',
      });
      setFormMode('edit');
      setSelectedProductId(savedProduct.id);
      setDraft(toProductFormState(savedProduct));
    },
    onError: (error) => {
      setFeedback({
        text: formatApiError(error, 'Nao foi possivel salvar o produto.'),
        tone: 'error',
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setFeedback({
        text: 'Produto removido com sucesso.',
        tone: 'success',
      });
      handleStartCreate();
    },
    onError: (error) => {
      setFeedback({
        text: formatApiError(error, 'Nao foi possivel excluir o produto.'),
        tone: 'error',
      });
    },
  });
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateProductAvailability(id, isAvailable),
    onSuccess: async (updatedProduct) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      if (selectedProductId === updatedProduct.id) {
        setDraft(toProductFormState(updatedProduct));
      }
    },
  });
  const products = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination ?? {
    limit: 20,
    page: 1,
    total: 0,
    totalPages: 0,
  };
  const isListLoading = listQuery.isLoading;
  const listError = listQuery.error
    ? formatApiError(listQuery.error, 'Nao foi possivel carregar os produtos.')
    : null;
  const isSubmitting =
    saveMutation.isPending || deleteMutation.isPending || toggleAvailabilityMutation.isPending;

  async function handleSelectProduct(productId: string) {
    if (!canWrite) {
      return;
    }

    setFeedback(null);
    setFormMode('edit');
    setSelectedProductId(productId);
    setIsDeleteConfirming(false);
    setIsDetailsLoading(true);

    try {
      const product = await getProduct(productId);
      setDraft(toProductFormState(product));
    } catch (error) {
      setFeedback({
        text: formatApiError(error, 'Nao foi possivel carregar o detalhe do produto.'),
        tone: 'error',
      });
    } finally {
      setIsDetailsLoading(false);
    }
  }

  function handleStartCreate() {
    setFeedback(null);
    setFormMode('create');
    setSelectedProductId(null);
    setDraft(emptyFormState);
    setIsDeleteConfirming(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateProductForm(draft);

    if (validationMessage) {
      setFeedback({
        text: validationMessage,
        tone: 'error',
      });
      return;
    }

    setFeedback(null);

    const payload = toProductPayload(draft);

    try {
      await saveMutation.mutateAsync(payload);
    } catch (error) {
      setFeedback({
        text: formatApiError(error, 'Nao foi possivel salvar o produto.'),
        tone: 'error',
      });
    }
  }

  async function handleDelete() {
    if (!selectedProductId) {
      return;
    }

    setFeedback(null);

    try {
      await deleteMutation.mutateAsync(selectedProductId);
    } catch (error) {
      setFeedback({
        text: formatApiError(error, 'Nao foi possivel excluir o produto.'),
        tone: 'error',
      });
    } finally {
      setIsDeleteConfirming(false);
    }
  }

  const totalUnavailable = products.filter((product) => !product.isAvailable).length;

  return (
    <section className="page admin-page">
      <header className="page-header admin-page__hero">
        <div>
          <p className="page-header__eyebrow">Catalogo operacional</p>
          <h1>Produtos visiveis em tempo real, mesmo quando a cozinha fecha o item.</h1>
          <p className="page-header__summary">
            A tela combina filtros, ordenacao e manutencao do cardapio com o mesmo contrato usado
            pela API. Itens indisponiveis continuam sob controle administrativo.
          </p>
        </div>

        <div className="hero-strip">
          <article className="hero-strip__item">
            <span>Produtos nesta pagina</span>
            <strong>{products.length}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Indisponiveis visiveis</span>
            <strong>{totalUnavailable}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Escopo</span>
            <strong>{canWrite ? 'admin' : 'viewer'}</strong>
          </article>
        </div>
      </header>

      <div className="admin-layout">
        <section className="sheet admin-main">
          <div className="admin-toolbar">
            <div className="admin-toolbar__group admin-toolbar__group--wide">
              <label className="field">
                <span>Buscar por nome</span>
                <input
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  placeholder="Ex.: burger, suco, batata"
                  value={searchInput}
                />
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Categoria</span>
                <select
                  onChange={(event) => {
                    setCategoryFilter(event.target.value as ProductCategory | 'all');
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  value={categoryFilter}
                >
                  <option value="all">Todas</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Disponibilidade</span>
                <select
                  onChange={(event) => {
                    setAvailabilityFilter(event.target.value as AvailabilityFilter);
                    startTransition(() => {
                      setPage(1);
                    });
                  }}
                  value={availabilityFilter}
                >
                  <option value="all">Todas</option>
                  <option value="available">Disponiveis</option>
                  <option value="unavailable">Indisponiveis</option>
                </select>
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
                <strong>Falha ao carregar o catalogo.</strong>
                <p>{listError}</p>
              </div>
            ) : isListLoading ? (
              <div className="empty-state">
                <strong>Atualizando o catalogo.</strong>
                <p>Buscando filtros, pagina atual e estado de disponibilidade.</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhum produto encontrado.</strong>
                <p>Ajuste os filtros ou limpe a busca para reencontrar o cardapio.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preco</th>
                    <th>Status</th>
                    <th>Preparo</th>
                    {canWrite ? <th>Acoes</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={product.isAvailable ? '' : 'data-table__row--muted'}
                    >
                      <td>
                        <div className="data-table__title">
                          <strong>{product.name}</strong>
                          <p>{product.description}</p>
                        </div>
                      </td>
                      <td>
                        <span className="status-pill status-pill--neutral">{product.category}</span>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <span
                          className={
                            product.isAvailable
                              ? 'status-pill status-pill--success'
                              : 'status-pill status-pill--warning'
                          }
                        >
                          {product.isAvailable ? 'Disponivel' : 'Indisponivel'}
                        </span>
                      </td>
                      <td>{product.preparationTime} min</td>
                      {canWrite ? (
                        <td>
                          <div className="detail-actions">
                            <button
                              className="button button--ghost button--small"
                              onClick={() => {
                                void handleSelectProduct(product.id);
                              }}
                              type="button"
                            >
                              Editar
                            </button>
                            <button
                              className="button button--ghost button--small"
                              disabled={toggleAvailabilityMutation.isPending}
                              onClick={() => {
                                void toggleAvailabilityMutation.mutateAsync({
                                  id: product.id,
                                  isAvailable: !product.isAvailable,
                                });
                              }}
                              type="button"
                            >
                              {product.isAvailable ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      ) : null}
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
              <p>{pagination.total} itens no total</p>
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
            <p className="callout__eyebrow">Painel de manutencao</p>
            <strong>
              {canWrite ? 'Criar, ajustar e retirar itens do cardapio.' : 'Modo somente leitura.'}
            </strong>
            <p>
              {canWrite
                ? 'As regras de exclusao seguem o backend: pedidos pending e preparing bloqueiam a remocao.'
                : 'Voce pode navegar, filtrar e inspecionar o catalogo, mas a edicao fica reservada ao perfil admin.'}
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
            <>
              <div className="panel-actions">
                <button className="button" onClick={handleStartCreate} type="button">
                  Novo produto
                </button>
                {selectedProductId ? (
                  <span className="panel-actions__hint">Editando o item selecionado</span>
                ) : (
                  <span className="panel-actions__hint">Pronto para cadastrar um novo item</span>
                )}
              </div>

              {isDetailsLoading ? (
                <div className="empty-state">
                  <strong>Carregando detalhes do produto.</strong>
                  <p>Sincronizando o formulario com o backend.</p>
                </div>
              ) : (
                <form className="editor-form" onSubmit={(event) => void handleSubmit(event)}>
                  <label className="field">
                    <span>Nome</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      value={draft.name}
                    />
                  </label>

                  <label className="field">
                    <span>Descricao</span>
                    <textarea
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={5}
                      value={draft.description}
                    />
                  </label>

                  <div className="editor-form__grid">
                    <label className="field">
                      <span>Preco</span>
                      <input
                        inputMode="decimal"
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, price: event.target.value }))
                        }
                        placeholder="32.90"
                        value={draft.price}
                      />
                    </label>

                    <label className="field">
                      <span>Preparo (min)</span>
                      <input
                        inputMode="numeric"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            preparationTime: event.target.value,
                          }))
                        }
                        value={draft.preparationTime}
                      />
                    </label>
                  </div>

                  <div className="editor-form__grid">
                    <label className="field">
                      <span>Categoria</span>
                      <select
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            category: event.target.value as ProductCategory,
                          }))
                        }
                        value={draft.category}
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Disponibilidade</span>
                      <select
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            isAvailable: event.target.value === 'true',
                          }))
                        }
                        value={String(draft.isAvailable)}
                      >
                        <option value="true">Disponivel</option>
                        <option value="false">Indisponivel</option>
                      </select>
                    </label>
                  </div>

                  <label className="field">
                    <span>Imagem</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, imageUrl: event.target.value }))
                      }
                      placeholder="https://example.com/imagem.jpg"
                      value={draft.imageUrl}
                    />
                  </label>

                  <div className="editor-form__actions">
                    <button className="button" disabled={isSubmitting} type="submit">
                      {isSubmitting
                        ? 'Salvando...'
                        : formMode === 'create'
                          ? 'Criar produto'
                          : 'Salvar alteracoes'}
                    </button>

                    {selectedProductId ? (
                      isDeleteConfirming ? (
                        <div className="danger-actions">
                          <button
                            className="button button--danger button--small"
                            disabled={isSubmitting}
                            onClick={() => {
                              void handleDelete();
                            }}
                            type="button"
                          >
                            Confirmar exclusao
                          </button>
                          <button
                            className="button button--ghost button--small"
                            disabled={isSubmitting}
                            onClick={() => setIsDeleteConfirming(false)}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="button button--ghost button--small"
                          disabled={isSubmitting}
                          onClick={() => setIsDeleteConfirming(true)}
                          type="button"
                        >
                          Excluir produto
                        </button>
                      )
                    ) : null}
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="empty-state">
              <strong>Visualizacao compartilhada com o viewer.</strong>
              <p>
                Produtos indisponiveis continuam aparecendo aqui para auditoria administrativa e
                acompanhamento operacional.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function toProductFormState(product: Product): ProductFormState {
  return {
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl ?? '',
    isAvailable: product.isAvailable,
    name: product.name,
    preparationTime: String(product.preparationTime),
    price: product.price.toFixed(2),
  };
}

function toProductPayload(draft: ProductFormState): SaveProductInput {
  return {
    category: draft.category,
    description: draft.description.trim(),
    imageUrl: draft.imageUrl.trim() || undefined,
    isAvailable: draft.isAvailable,
    name: draft.name.trim(),
    preparationTime: Number(draft.preparationTime),
    price: Number(draft.price),
  };
}

function validateProductForm(draft: ProductFormState) {
  const trimmedName = draft.name.trim();
  const trimmedDescription = draft.description.trim();
  const price = Number(draft.price);
  const preparationTime = Number(draft.preparationTime);

  if (trimmedName.length < 3 || trimmedName.length > 120) {
    return 'O nome deve ter entre 3 e 120 caracteres.';
  }

  if (trimmedDescription.length < 10 || trimmedDescription.length > 500) {
    return 'A descricao deve ter entre 10 e 500 caracteres.';
  }

  if (!Number.isFinite(price) || price <= 0 || !hasAtMostTwoDecimals(draft.price)) {
    return 'O preco deve ser maior que zero e ter no maximo 2 casas decimais.';
  }

  if (!Number.isInteger(preparationTime) || preparationTime < 1 || preparationTime > 120) {
    return 'O tempo de preparo deve ser um inteiro entre 1 e 120.';
  }

  if (draft.imageUrl.trim().length > 0) {
    try {
      new URL(draft.imageUrl.trim());
    } catch {
      return 'A imagem deve ser uma URL valida.';
    }
  }

  return null;
}

function hasAtMostTwoDecimals(value: string) {
  const normalized = value.trim();
  const [, decimals = ''] = normalized.split('.');

  return decimals.length <= 2;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}
