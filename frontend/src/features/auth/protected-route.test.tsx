import { screen } from '@testing-library/react';
import { renderWithAuthRouter } from '../../test/render-with-auth';
import { ProtectedRoute } from './protected-route';

describe('ProtectedRoute', () => {
  it('redirects anonymous users to login', async () => {
    renderWithAuthRouter(
      [
        {
          path: '/dashboard',
          element: <ProtectedRoute />,
          children: [
            {
              index: true,
              element: <div>Painel protegido</div>,
            },
          ],
        },
        {
          path: '/login',
          element: <div>Login</div>,
        },
      ],
      {
        initialEntries: ['/dashboard'],
      },
    );

    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('renders the protected outlet for authenticated sessions', async () => {
    renderWithAuthRouter(
      [
        {
          path: '/dashboard',
          element: <ProtectedRoute />,
          children: [
            {
              index: true,
              element: <div>Painel protegido</div>,
            },
          ],
        },
        {
          path: '/login',
          element: <div>Login</div>,
        },
      ],
      {
        auth: {
          status: 'authenticated',
          isAuthenticated: true,
          user: {
            id: 'user-1',
            email: 'admin@fastmeals.com',
            role: 'admin',
          },
        },
        initialEntries: ['/dashboard'],
      },
    );

    expect(await screen.findByText('Painel protegido')).toBeInTheDocument();
  });
});
