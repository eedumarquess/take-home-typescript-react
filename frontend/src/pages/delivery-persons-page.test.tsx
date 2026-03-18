import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createDeliveryPerson,
  deleteDeliveryPerson,
  listDeliveryPersons,
  updateDeliveryPerson,
} from '../features/delivery-persons/api';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { DeliveryPersonsPage } from './delivery-persons-page';

vi.mock('../features/delivery-persons/api', () => ({
  createDeliveryPerson: vi.fn(),
  deleteDeliveryPerson: vi.fn(),
  listDeliveryPersons: vi.fn(),
  updateDeliveryPerson: vi.fn(),
}));

const listDeliveryPersonsMock = vi.mocked(listDeliveryPersons);
const createDeliveryPersonMock = vi.mocked(createDeliveryPerson);
const updateDeliveryPersonMock = vi.mocked(updateDeliveryPerson);
const deleteDeliveryPersonMock = vi.mocked(deleteDeliveryPerson);

const baseDeliveryPersonsResponse = {
  data: [
    {
      currentLatitude: -23.5489,
      currentLongitude: -46.6388,
      currentOrderId: 'order-1',
      id: 'delivery-1',
      isActive: true,
      name: 'Carlos Santos',
      phone: '(11) 91234-5678',
      vehicleType: 'motorcycle' as const,
    },
  ],
};

describe('DeliveryPersonsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDeliveryPersonsMock.mockResolvedValue(baseDeliveryPersonsResponse);
    createDeliveryPersonMock.mockResolvedValue(baseDeliveryPersonsResponse.data[0]);
    updateDeliveryPersonMock.mockResolvedValue(baseDeliveryPersonsResponse.data[0]);
    deleteDeliveryPersonMock.mockResolvedValue(undefined);
  });

  it('blocks the module in the frontend for viewers', () => {
    renderDeliveryPersonsPage({
      role: 'viewer',
    });

    expect(
      screen.getByText('Gestao de entregadores reservada ao perfil admin.'),
    ).toBeInTheDocument();
    expect(listDeliveryPersonsMock).not.toHaveBeenCalled();
  });

  it('filters the fleet list and creates a delivery person for admins', async () => {
    const user = userEvent.setup();

    createDeliveryPersonMock.mockResolvedValue({
      currentLatitude: null,
      currentLongitude: null,
      currentOrderId: null,
      id: 'delivery-9',
      isActive: true,
      name: 'Mariana Souza',
      phone: '(11) 96789-0123',
      vehicleType: 'bicycle',
    });

    renderDeliveryPersonsPage({
      role: 'admin',
    });

    expect(await screen.findByText('Carlos Santos')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Disponibilidade'), 'available');

    await waitFor(() => {
      expect(listDeliveryPersonsMock.mock.calls.at(-1)?.[0]).toMatchObject({
        available: true,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Novo entregador' }));
    await user.clear(screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Mariana Souza');
    await user.clear(screen.getByLabelText('Telefone'));
    await user.type(screen.getByLabelText('Telefone'), '(11) 96789-0123');
    await user.selectOptions(screen.getByLabelText('Veiculo'), 'bicycle');
    await user.click(screen.getByRole('button', { name: 'Criar entregador' }));

    await waitFor(() => {
      expect(createDeliveryPersonMock).toHaveBeenCalledWith({
        currentLatitude: undefined,
        currentLongitude: undefined,
        isActive: true,
        name: 'Mariana Souza',
        phone: '(11) 96789-0123',
        vehicleType: 'bicycle',
      });
    });
    expect(await screen.findByText('Entregador criado com sucesso.')).toBeInTheDocument();
  });
});

function renderDeliveryPersonsPage(options: { role: 'admin' | 'viewer' }) {
  return renderWithAuthRouter(
    [
      {
        path: '/delivery-persons',
        element: <DeliveryPersonsPage />,
      },
    ],
    {
      auth: {
        isAuthenticated: true,
        status: 'authenticated',
        user: {
          email: `${options.role}@fastmeals.com`,
          id: `user-${options.role}`,
          role: options.role,
        },
      },
      initialEntries: ['/delivery-persons'],
    },
  );
}
