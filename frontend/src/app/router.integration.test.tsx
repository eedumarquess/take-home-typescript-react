import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthContext, AuthProvider, createAuthContextValue } from '../features/auth/auth-context';
import { ProtectedRoute } from '../features/auth/protected-route';
import { requestJson } from '../services/api';

function buildToken(payload: Record<string, string>) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `header.${encodedPayload}.signature`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

function OrdersProbe() {
  useEffect(() => {
    void requestJson('/orders').catch(() => undefined);
  }, []);

  return <div>Pedidos carregados</div>;
}

describe('app router integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects anonymous access from a protected route to login', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Outlet />,
          children: [
            {
              element: <ProtectedRoute />,
              children: [
                {
                  path: '/orders',
                  element: <div>Pedidos</div>,
                },
              ],
            },
            {
              path: '/login',
              element: <div>Login</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/orders'],
      },
    );

    render(
      <AuthContext.Provider value={createAuthContextValue()}>
        <RouterProvider router={router} />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('redirects back to login when refresh fails during an authenticated request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: buildToken({
            email: 'admin@fastmeals.com',
            role: 'admin',
            sub: 'user-1',
          }),
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Access token expirado',
              details: [],
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'Refresh token invalido ou expirado',
              details: [],
            },
          },
          401,
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const router = createMemoryRouter(
      [
        {
          element: <Outlet />,
          children: [
            {
              element: <ProtectedRoute />,
              children: [
                {
                  path: '/orders',
                  element: <OrdersProbe />,
                },
              ],
            },
            {
              path: '/login',
              element: <div>Login</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/orders'],
      },
    );

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    );

    expect(await screen.findByText('Pedidos carregados')).toBeInTheDocument();
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
