import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { listDeliveryPersons } from '../features/delivery-persons/api';
import {
  assignDeliveryPerson,
  createOrder,
  getOrder,
  listOrders,
  optimizeAssignment,
  updateOrderStatus,
} from '../features/orders/api';
import type { Order } from '../features/orders/types';
import { listProducts } from '../features/products/api';
import { ApiError } from '../services/api';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { OrdersPage } from './orders-page';

vi.mock('../features/orders/api', () => ({
  assignDeliveryPerson: vi.fn(),
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  listOrders: vi.fn(),
  optimizeAssignment: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

vi.mock('../features/products/api', () => ({
  listProducts: vi.fn(),
}));

vi.mock('../features/delivery-persons/api', () => ({
  listDeliveryPersons: vi.fn(),
}));

const listOrdersMock = vi.mocked(listOrders);
const getOrderMock = vi.mocked(getOrder);
const createOrderMock = vi.mocked(createOrder);
const updateOrderStatusMock = vi.mocked(updateOrderStatus);
const assignDeliveryPersonMock = vi.mocked(assignDeliveryPerson);
const optimizeAssignmentMock = vi.mocked(optimizeAssignment);
const listProductsMock = vi.mocked(listProducts);
const listDeliveryPersonsMock = vi.mocked(listDeliveryPersons);

const pendingOrder = buildOrder({
  deliveryPerson: null,
  id: 'order-pending',
  status: 'pending',
});

const readyOrder = buildOrder({
  deliveryPerson: null,
  id: 'order-ready',
  status: 'ready',
});

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOrdersMock.mockResolvedValue({
      data: [pendingOrder],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
    getOrderMock.mockResolvedValue(pendingOrder);
    createOrderMock.mockResolvedValue(
      buildOrder({
        id: 'order-new',
        status: 'pending',
      }),
    );
    updateOrderStatusMock.mockResolvedValue(
      buildOrder({
        id: 'order-pending',
        status: 'preparing',
      }),
    );
    assignDeliveryPersonMock.mockResolvedValue(
      buildOrder({
        deliveryPerson: {
          id: 'delivery-1',
          name: 'Carlos Santos',
          phone: '(11) 91234-5678',
          vehicleType: 'motorcycle',
        },
        id: 'order-ready',
        status: 'ready',
      }),
    );
    listProductsMock.mockResolvedValue({
      data: [
        {
          category: 'meal',
          createdAt: '2025-01-10T10:00:00.000Z',
          description: 'Hamburguer artesanal',
          id: 'product-1',
          imageUrl: null,
          isAvailable: true,
          name: 'X-Burger',
          preparationTime: 20,
          price: 32.9,
          updatedAt: '2025-01-10T10:00:00.000Z',
        },
      ],
      pagination: {
        limit: 100,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
    listDeliveryPersonsMock.mockResolvedValue({
      data: [
        {
          currentLatitude: -23.55,
          currentLongitude: -46.63,
          currentOrderId: null,
          id: 'delivery-1',
          isActive: true,
          name: 'Carlos Santos',
          phone: '(11) 91234-5678',
          vehicleType: 'motorcycle',
        },
      ],
    });
    optimizeAssignmentMock.mockResolvedValue({
      algorithm: 'hungarian',
      assignments: [
        {
          deliveryPersonId: 'delivery-1',
          deliveryPersonName: 'Carlos Santos',
          estimatedDistanceKm: 2.4,
          orderAddress: 'Rua das Flores, 123, Sao Paulo - SP',
          orderId: 'order-ready',
        },
      ],
      executionTimeMs: 12,
      totalDistanceKm: 2.4,
      unassigned: [],
    });
  });

  it('renders orders in read-only mode for viewers', async () => {
    renderOrdersPage('viewer');

    expect(await screen.findByText('Joao Silva')).toBeInTheDocument();
    expect(screen.getByText('Modo somente leitura para acompanhamento.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Novo pedido' })).not.toBeInTheDocument();
  });

  it('applies status and date filters to listOrders', async () => {
    const user = userEvent.setup();

    renderOrdersPage('viewer');
    await screen.findByText('Joao Silva');

    await user.selectOptions(screen.getByLabelText('Status'), 'ready');
    await user.type(screen.getByLabelText('Inicio'), '2025-01-01');
    await user.type(screen.getByLabelText('Fim'), '2025-01-31');

    await waitFor(() => {
      expect(listOrdersMock.mock.calls.at(-1)?.[0]).toMatchObject({
        endDate: '2025-01-31',
        page: 1,
        startDate: '2025-01-01',
        status: 'ready',
      });
    });
  });

  it('creates an order from the split-view form for admins', async () => {
    const user = userEvent.setup();

    renderOrdersPage('admin');
    await screen.findByText('Joao Silva');

    await user.click(screen.getByRole('button', { name: 'Novo pedido' }));
    await screen.findByRole('option', { name: 'X-Burger' });
    await user.type(screen.getByLabelText('Cliente'), 'Maria Oliveira');
    await user.type(screen.getByLabelText('Telefone'), '(11) 99876-5432');
    await user.type(screen.getByLabelText('Endereco'), 'Rua das Flores, 123, Sao Paulo - SP');
    await user.type(screen.getByLabelText('Latitude'), '-23.5505');
    await user.type(screen.getByLabelText('Longitude'), '-46.6333');
    await user.selectOptions(screen.getByLabelText('Produto 1'), 'product-1');
    await user.clear(screen.getByLabelText('Quantidade 1'));
    await user.type(screen.getByLabelText('Quantidade 1'), '2');
    await user.click(screen.getByRole('button', { name: 'Criar pedido' }));

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledWith({
        customerName: 'Maria Oliveira',
        customerPhone: '(11) 99876-5432',
        deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
        items: [{ productId: 'product-1', quantity: 2 }],
        latitude: -23.5505,
        longitude: -46.6333,
      });
    });
    expect(await screen.findByText('Pedido criado com sucesso.')).toBeInTheDocument();
  });

  it('runs a contextual status transition for admins', async () => {
    const user = userEvent.setup();

    renderOrdersPage('admin');
    await screen.findByText('Joao Silva');

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await waitFor(() => expect(getOrderMock).toHaveBeenCalledWith('order-pending'));
    await user.click(screen.getByRole('button', { name: 'Iniciar preparo' }));

    await waitFor(() => {
      expect(updateOrderStatusMock).toHaveBeenCalledWith('order-pending', 'preparing');
    });
    expect(await screen.findByText('Pedido atualizado para Preparing.')).toBeInTheDocument();
  });

  it('shows business errors when manual assignment is rejected', async () => {
    const user = userEvent.setup();

    listOrdersMock.mockResolvedValue({
      data: [readyOrder],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
    getOrderMock.mockResolvedValue(readyOrder);
    assignDeliveryPersonMock.mockRejectedValue(
      new ApiError(
        'Este entregador ja esta atribuido a outro pedido em andamento',
        422,
        'DELIVERY_PERSON_UNAVAILABLE',
        [],
      ),
    );

    renderOrdersPage('admin');
    await screen.findByText('Joao Silva');

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await waitFor(() => expect(getOrderMock).toHaveBeenCalledWith('order-ready'));
    await waitFor(() => expect(listDeliveryPersonsMock).toHaveBeenCalled());
    await user.selectOptions(screen.getByLabelText('Entregador'), 'delivery-1');
    await user.click(screen.getByRole('button', { name: 'Atribuir entregador' }));

    expect(
      await screen.findByText('Este entregador ja esta atribuido a outro pedido em andamento'),
    ).toBeInTheDocument();
  });

  it('loads optimized suggestions and applies the selected assignment flow', async () => {
    const user = userEvent.setup();

    listOrdersMock.mockResolvedValue({
      data: [readyOrder],
      pagination: {
        limit: 20,
        page: 1,
        total: 1,
        totalPages: 1,
      },
    });
    updateOrderStatusMock.mockResolvedValue(
      buildOrder({
        deliveryPerson: {
          id: 'delivery-1',
          name: 'Carlos Santos',
          phone: '(11) 91234-5678',
          vehicleType: 'motorcycle',
        },
        id: 'order-ready',
        status: 'delivering',
      }),
    );

    renderOrdersPage('admin');
    await screen.findByText('Joao Silva');

    await user.click(screen.getByRole('button', { name: 'Sugerir atribuicao otimizada' }));

    expect(await screen.findByText('Carlos Santos')).toBeInTheDocument();
    expect(optimizeAssignmentMock).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Aceitar e iniciar entrega' }));

    await waitFor(() => {
      expect(assignDeliveryPersonMock).toHaveBeenCalledWith('order-ready', 'delivery-1');
      expect(updateOrderStatusMock).toHaveBeenCalledWith('order-ready', 'delivering');
    });
    expect(await screen.findByText('Sugestao aplicada para Joao Silva.')).toBeInTheDocument();
  });
});

function renderOrdersPage(role: 'admin' | 'viewer') {
  return renderWithAuthRouter(
    [
      {
        path: '/orders',
        element: <OrdersPage />,
      },
    ],
    {
      auth: {
        isAuthenticated: true,
        status: 'authenticated',
        user: {
          email: `${role}@fastmeals.com`,
          id: `user-${role}`,
          role,
        },
      },
      initialEntries: ['/orders'],
    },
  );
}

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    createdAt: '2025-01-20T14:30:00.000Z',
    customerName: 'Joao Silva',
    customerPhone: '(11) 99999-1234',
    deliveredAt: null,
    deliveryAddress: 'Rua das Flores, 123, Sao Paulo - SP',
    deliveryPerson: {
      id: 'delivery-9',
      name: 'Ana Souza',
      phone: '(11) 93456-7890',
      vehicleType: 'bicycle' as const,
    },
    id: 'order-1',
    items: [
      {
        id: 'item-1',
        product: {
          id: 'product-1',
          name: 'X-Burger',
        },
        quantity: 2,
        unitPrice: 32.9,
      },
    ],
    latitude: -23.5505,
    longitude: -46.6333,
    status: 'pending' as const,
    totalAmount: 65.8,
    updatedAt: '2025-01-20T14:30:00.000Z',
    ...overrides,
  };
}
