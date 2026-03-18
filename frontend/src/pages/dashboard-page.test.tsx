import { screen } from '@testing-library/react';
import {
  getAverageDeliveryTimeReport,
  getOrdersByStatusReport,
  getRevenueReport,
} from '../features/reports/api';
import { AppShell } from '../layouts/app-shell';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { DashboardPage } from './dashboard-page';

vi.mock('../features/reports/api', () => ({
  getAverageDeliveryTimeReport: vi.fn(),
  getOrdersByStatusReport: vi.fn(),
  getRevenueReport: vi.fn(),
}));

const getRevenueReportMock = vi.mocked(getRevenueReport);
const getOrdersByStatusReportMock = vi.mocked(getOrdersByStatusReport);
const getAverageDeliveryTimeReportMock = vi.mocked(getAverageDeliveryTimeReport);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRevenueReportMock.mockResolvedValue({
      averageOrderValue: 40,
      dailyRevenue: [],
      endDate: '2025-01-02',
      startDate: '2025-01-01',
      totalOrders: 3,
      totalRevenue: 120,
    });
    getOrdersByStatusReportMock.mockResolvedValue({
      data: [
        { count: 0, status: 'pending' },
        { count: 0, status: 'preparing' },
        { count: 2, status: 'ready' },
        { count: 1, status: 'delivering' },
        { count: 3, status: 'delivered' },
        { count: 0, status: 'cancelled' },
      ],
      total: 6,
    });
    getAverageDeliveryTimeReportMock.mockResolvedValue({
      averageMinutes: 42.5,
      byVehicleType: [],
      fastestMinutes: 18,
      slowestMinutes: 87,
      totalDelivered: 3,
    });
  });

  it('renders final product copy without sprint placeholder language', async () => {
    renderWithAuthRouter(
      [
        {
          element: <AppShell />,
          children: [
            {
              path: '/dashboard',
              element: <DashboardPage />,
            },
          ],
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
        initialEntries: ['/dashboard'],
      },
    );

    expect(await screen.findByText('Receita entregue')).toBeInTheDocument();
    expect(screen.getByText('Operacao FastMeals')).toBeInTheDocument();
    expect(screen.getByText('Pedidos prontos')).toBeInTheDocument();
    expect(screen.queryByText('Sprint 01')).not.toBeInTheDocument();
    expect(screen.queryByText(/bootstrap/i)).not.toBeInTheDocument();
  });
});
