import { screen } from '@testing-library/react';
import { AppShell } from '../layouts/app-shell';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
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

    expect(
      await screen.findByText('Central de operacoes pronta para catalogo, fila e distribuicao.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Operacao FastMeals')).toBeInTheDocument();
    expect(screen.getByText('Catalogo sob controle')).toBeInTheDocument();
    expect(screen.queryByText('Sprint 01')).not.toBeInTheDocument();
    expect(screen.queryByText(/bootstrap/i)).not.toBeInTheDocument();
  });
});
