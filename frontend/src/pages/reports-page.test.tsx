import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  getAverageDeliveryTimeReport,
  getOrdersByStatusReport,
  getRevenueReport,
  getTopProductsReport,
} from '../features/reports/api';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { ReportsPage } from './reports-page';

vi.mock('../features/reports/api', () => ({
  getAverageDeliveryTimeReport: vi.fn(),
  getOrdersByStatusReport: vi.fn(),
  getRevenueReport: vi.fn(),
  getTopProductsReport: vi.fn(),
}));

const getRevenueReportMock = vi.mocked(getRevenueReport);
const getOrdersByStatusReportMock = vi.mocked(getOrdersByStatusReport);
const getTopProductsReportMock = vi.mocked(getTopProductsReport);
const getAverageDeliveryTimeReportMock = vi.mocked(getAverageDeliveryTimeReport);

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRevenueReportMock.mockResolvedValue({
      averageOrderValue: 40,
      dailyRevenue: [
        { date: '2025-01-01', orders: 2, revenue: 80 },
        { date: '2025-01-02', orders: 1, revenue: 20 },
      ],
      endDate: '2025-01-02',
      startDate: '2025-01-01',
      totalOrders: 3,
      totalRevenue: 120,
    });
    getOrdersByStatusReportMock.mockResolvedValue({
      data: [
        { count: 1, status: 'pending' },
        { count: 1, status: 'ready' },
        { count: 1, status: 'delivered' },
        { count: 0, status: 'preparing' },
        { count: 0, status: 'delivering' },
        { count: 0, status: 'cancelled' },
      ],
      total: 3,
    });
    getTopProductsReportMock.mockResolvedValue({
      data: [
        {
          productId: 'product-1',
          productName: 'X-Burger',
          totalQuantity: 5,
          totalRevenue: 150,
        },
      ],
    });
    getAverageDeliveryTimeReportMock.mockResolvedValue({
      averageMinutes: 42.5,
      byVehicleType: [{ averageMinutes: 35.2, count: 2, vehicleType: 'motorcycle' }],
      fastestMinutes: 18,
      slowestMinutes: 87,
      totalDelivered: 3,
    });
  });

  it('renders the analytics dashboard with live report data', async () => {
    renderReportsPage();

    expect(await screen.findByText('Cadencia de entregas faturadas')).toBeInTheDocument();
    expect(screen.getByText('R$ 120,00')).toBeInTheDocument();
    expect(screen.getByText('42,5 min')).toBeInTheDocument();
    expect(screen.getByText('X-Burger')).toBeInTheDocument();
    expect(screen.getByText('Moto')).toBeInTheDocument();
  });

  it('reapplies the selected period across all analytics endpoints', async () => {
    const user = userEvent.setup();

    renderReportsPage();
    await screen.findByText('Cadencia de entregas faturadas');

    await user.type(screen.getByLabelText('Inicio'), '2025-01-01');
    await user.type(screen.getByLabelText('Fim'), '2025-01-31');
    await user.click(screen.getByRole('button', { name: 'Aplicar recorte' }));

    await waitFor(() => {
      expect(getRevenueReportMock.mock.calls.at(-1)?.[0]).toEqual({
        endDate: '2025-01-31',
        startDate: '2025-01-01',
      });
      expect(getOrdersByStatusReportMock.mock.calls.at(-1)?.[0]).toEqual({
        endDate: '2025-01-31',
        startDate: '2025-01-01',
      });
      expect(getTopProductsReportMock.mock.calls.at(-1)?.[0]).toEqual({
        endDate: '2025-01-31',
        limit: 10,
        startDate: '2025-01-01',
      });
      expect(getAverageDeliveryTimeReportMock.mock.calls.at(-1)?.[0]).toEqual({
        endDate: '2025-01-31',
        startDate: '2025-01-01',
      });
    });
  });
});

function renderReportsPage() {
  return renderWithAuthRouter(
    [
      {
        path: '/reports',
        element: <ReportsPage />,
      },
    ],
    {
      auth: {
        isAuthenticated: true,
        status: 'authenticated',
        user: {
          email: 'admin@fastmeals.com',
          id: 'user-admin',
          role: 'admin',
        },
      },
      initialEntries: ['/reports'],
    },
  );
}
