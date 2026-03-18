import { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/auth-context';
import {
  createDeliveryPerson,
  deleteDeliveryPerson,
  listDeliveryPersons,
  updateDeliveryPerson,
} from '../features/delivery-persons/api';
import type {
  DeliveryPerson,
  SaveDeliveryPersonInput,
  VehicleType,
} from '../features/delivery-persons/types';
import { ApiError } from '../services/api';

type DeliveryPersonFormState = {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isActive: boolean;
  currentLatitude: string;
  currentLongitude: string;
};

type FeedbackState = {
  tone: 'error' | 'success';
  text: string;
} | null;

type ActivityFilter = 'all' | 'active' | 'inactive';
type AvailabilityFilter = 'all' | 'available' | 'busy';

const vehicleOptions: Array<{ label: string; value: VehicleType }> = [
  { label: 'Bicycle', value: 'bicycle' },
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Car', value: 'car' },
];

const emptyFormState: DeliveryPersonFormState = {
  currentLatitude: '',
  currentLongitude: '',
  isActive: true,
  name: '',
  phone: '',
  vehicleType: 'motorcycle',
};

export function DeliveryPersonsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <section className="page admin-page">
        <header className="page-header admin-page__hero">
          <div>
            <p className="page-header__eyebrow">Fleet control</p>
            <h1>Gestao de entregadores reservada ao perfil admin.</h1>
            <p className="page-header__summary">
              O backend fecha o acesso com RBAC e o frontend espelha essa restricao para evitar
              fluxo morto no painel.
            </p>
          </div>
        </header>

        <div className="sheet empty-state">
          <strong>Modulo indisponivel para viewer.</strong>
          <p>Produtos, pedidos e relatorios continuam acessiveis com o seu perfil atual.</p>
        </div>
      </section>
    );
  }

  return <DeliveryPersonsAdminPage />;
}

function DeliveryPersonsAdminPage() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeliveryPersonFormState>(emptyFormState);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const reloadToken = refreshNonce;
    const query = {
      available: availabilityFilter === 'all' ? undefined : availabilityFilter === 'available',
      isActive: activityFilter === 'all' ? undefined : activityFilter === 'active',
    };

    async function run() {
      if (reloadToken < 0) {
        return;
      }

      setIsLoading(true);
      setListError(null);

      try {
        const response = await listDeliveryPersons(query);

        setDeliveryPersons(response.data);
      } catch (error) {
        setDeliveryPersons([]);
        setListError(toErrorMessage(error, 'Nao foi possivel carregar os entregadores.'));
      } finally {
        setIsLoading(false);
      }
    }

    void run();
  }, [activityFilter, availabilityFilter, refreshNonce]);

  function handleSelectDeliveryPerson(deliveryPerson: DeliveryPerson) {
    setFeedback(null);
    setFormMode('edit');
    setSelectedDeliveryPersonId(deliveryPerson.id);
    setDraft(toDeliveryPersonFormState(deliveryPerson));
    setIsDeleteConfirming(false);
  }

  function handleStartCreate() {
    setFeedback(null);
    setFormMode('create');
    setSelectedDeliveryPersonId(null);
    setDraft(emptyFormState);
    setIsDeleteConfirming(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateDeliveryPersonForm(draft);

    if (validationMessage) {
      setFeedback({
        text: validationMessage,
        tone: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload = toDeliveryPersonPayload(draft);

    try {
      const savedDeliveryPerson =
        formMode === 'create' || !selectedDeliveryPersonId
          ? await createDeliveryPerson(payload)
          : await updateDeliveryPerson(selectedDeliveryPersonId, payload);

      setFeedback({
        text:
          formMode === 'create'
            ? 'Entregador criado com sucesso.'
            : 'Entregador atualizado com sucesso.',
        tone: 'success',
      });
      setFormMode('edit');
      setSelectedDeliveryPersonId(savedDeliveryPerson.id);
      setDraft(toDeliveryPersonFormState(savedDeliveryPerson));
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setFeedback({
        text: toErrorMessage(error, 'Nao foi possivel salvar o entregador.'),
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedDeliveryPersonId) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await deleteDeliveryPerson(selectedDeliveryPersonId);
      setFeedback({
        text: 'Entregador removido com sucesso.',
        tone: 'success',
      });
      handleStartCreate();
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setFeedback({
        text:
          error instanceof ApiError && error.code === 'DELIVERY_PERSON_IN_USE'
            ? 'Este entregador esta vinculado a uma entrega em andamento e nao pode ser removido.'
            : toErrorMessage(error, 'Nao foi possivel excluir o entregador.'),
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirming(false);
    }
  }

  const busyCount = deliveryPersons.filter(
    (deliveryPerson) => deliveryPerson.currentOrderId,
  ).length;

  return (
    <section className="page admin-page">
      <header className="page-header admin-page__hero">
        <div>
          <p className="page-header__eyebrow">Fleet control</p>
          <h1>
            Frota ativa, disponibilidade em andamento e bloqueios operacionais no mesmo quadro.
          </h1>
          <p className="page-header__summary">
            A listagem mostra quem pode receber atribuicao agora, quem esta em corrida e qual pedido
            esta consumindo a capacidade da frota.
          </p>
        </div>

        <div className="hero-strip">
          <article className="hero-strip__item">
            <span>Na tela</span>
            <strong>{deliveryPersons.length}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Em entrega</span>
            <strong>{busyCount}</strong>
          </article>
          <article className="hero-strip__item">
            <span>Perfil</span>
            <strong>admin</strong>
          </article>
        </div>
      </header>

      <div className="admin-layout">
        <section className="sheet admin-main">
          <div className="admin-toolbar">
            <div className="admin-toolbar__group">
              <label className="field">
                <span>Status ativo</span>
                <select
                  onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                  value={activityFilter}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </label>
            </div>

            <div className="admin-toolbar__group">
              <label className="field">
                <span>Disponibilidade</span>
                <select
                  onChange={(event) =>
                    setAvailabilityFilter(event.target.value as AvailabilityFilter)
                  }
                  value={availabilityFilter}
                >
                  <option value="all">Todos</option>
                  <option value="available">Disponiveis</option>
                  <option value="busy">Em entrega</option>
                </select>
              </label>
            </div>
          </div>

          <div className="table-shell">
            {listError ? (
              <div className="empty-state empty-state--error" role="alert">
                <strong>Falha ao carregar a frota.</strong>
                <p>{listError}</p>
              </div>
            ) : isLoading ? (
              <div className="empty-state">
                <strong>Buscando status da frota.</strong>
                <p>Conferindo disponibilidade, atividade e pedido em andamento.</p>
              </div>
            ) : deliveryPersons.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhum entregador encontrado.</strong>
                <p>Ajuste os filtros para reenquadrar a frota operacional.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entregador</th>
                    <th>Veiculo</th>
                    <th>Atividade</th>
                    <th>Disponibilidade</th>
                    <th>Pedido atual</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryPersons.map((deliveryPerson) => {
                    const isBusy = deliveryPerson.currentOrderId !== null;

                    return (
                      <tr
                        key={deliveryPerson.id}
                        className={deliveryPerson.isActive ? '' : 'data-table__row--muted'}
                      >
                        <td>
                          <div className="data-table__title">
                            <strong>{deliveryPerson.name}</strong>
                            <p>{deliveryPerson.phone}</p>
                          </div>
                        </td>
                        <td>
                          <span className="status-pill status-pill--neutral">
                            {deliveryPerson.vehicleType}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              deliveryPerson.isActive
                                ? 'status-pill status-pill--success'
                                : 'status-pill status-pill--warning'
                            }
                          >
                            {deliveryPerson.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              isBusy
                                ? 'status-pill status-pill--warning'
                                : 'status-pill status-pill--success'
                            }
                          >
                            {isBusy ? 'Ocupado' : 'Disponivel'}
                          </span>
                        </td>
                        <td>{deliveryPerson.currentOrderId ?? 'Sem corrida ativa'}</td>
                        <td>
                          <button
                            className="button button--ghost button--small"
                            onClick={() => handleSelectDeliveryPerson(deliveryPerson)}
                            type="button"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="callout admin-side">
          <div className="callout__cluster">
            <p className="callout__eyebrow">Manutencao da frota</p>
            <strong>
              Cada entregador aparece com o estado operacional que a atribuicao precisa respeitar.
            </strong>
            <p>
              Entregadores em pedido `delivering` retornam com `currentOrderId` e a exclusao fica
              bloqueada enquanto a corrida nao termina.
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

          <div className="panel-actions">
            <button className="button" onClick={handleStartCreate} type="button">
              Novo entregador
            </button>
            {selectedDeliveryPersonId ? (
              <span className="panel-actions__hint">Edicao em andamento</span>
            ) : (
              <span className="panel-actions__hint">Cadastro pronto para novo membro da frota</span>
            )}
          </div>

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
              <span>Telefone</span>
              <input
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="(11) 91234-5678"
                value={draft.phone}
              />
            </label>

            <div className="editor-form__grid">
              <label className="field">
                <span>Veiculo</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      vehicleType: event.target.value as VehicleType,
                    }))
                  }
                  value={draft.vehicleType}
                >
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      isActive: event.target.value === 'true',
                    }))
                  }
                  value={String(draft.isActive)}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </label>
            </div>

            <div className="editor-form__grid">
              <label className="field">
                <span>Latitude atual</span>
                <input
                  inputMode="decimal"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, currentLatitude: event.target.value }))
                  }
                  placeholder="-23.54890000"
                  value={draft.currentLatitude}
                />
              </label>

              <label className="field">
                <span>Longitude atual</span>
                <input
                  inputMode="decimal"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, currentLongitude: event.target.value }))
                  }
                  placeholder="-46.63880000"
                  value={draft.currentLongitude}
                />
              </label>
            </div>

            <div className="editor-form__actions">
              <button className="button" disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? 'Salvando...'
                  : formMode === 'create'
                    ? 'Criar entregador'
                    : 'Salvar alteracoes'}
              </button>

              {selectedDeliveryPersonId ? (
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
                    Excluir entregador
                  </button>
                )
              ) : null}
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}

function toDeliveryPersonFormState(deliveryPerson: DeliveryPerson): DeliveryPersonFormState {
  return {
    currentLatitude:
      deliveryPerson.currentLatitude === null ? '' : String(deliveryPerson.currentLatitude),
    currentLongitude:
      deliveryPerson.currentLongitude === null ? '' : String(deliveryPerson.currentLongitude),
    isActive: deliveryPerson.isActive,
    name: deliveryPerson.name,
    phone: deliveryPerson.phone,
    vehicleType: deliveryPerson.vehicleType,
  };
}

function toDeliveryPersonPayload(draft: DeliveryPersonFormState): SaveDeliveryPersonInput {
  return {
    currentLatitude: draft.currentLatitude.trim() ? Number(draft.currentLatitude) : undefined,
    currentLongitude: draft.currentLongitude.trim() ? Number(draft.currentLongitude) : undefined,
    isActive: draft.isActive,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    vehicleType: draft.vehicleType,
  };
}

function validateDeliveryPersonForm(draft: DeliveryPersonFormState) {
  const trimmedName = draft.name.trim();
  const trimmedPhone = draft.phone.trim();
  const hasLatitude = draft.currentLatitude.trim().length > 0;
  const hasLongitude = draft.currentLongitude.trim().length > 0;

  if (trimmedName.length < 3 || trimmedName.length > 100) {
    return 'O nome deve ter entre 3 e 100 caracteres.';
  }

  if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(trimmedPhone)) {
    return 'O telefone deve seguir o formato (11) 91234-5678.';
  }

  if (hasLatitude !== hasLongitude) {
    return 'Informe latitude e longitude juntas para registrar a posicao atual.';
  }

  if (hasLatitude && hasLongitude) {
    const latitude = Number(draft.currentLatitude);
    const longitude = Number(draft.currentLongitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return 'A latitude atual deve estar entre -90 e 90.';
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return 'A longitude atual deve estar entre -180 e 180.';
    }
  }

  return null;
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
