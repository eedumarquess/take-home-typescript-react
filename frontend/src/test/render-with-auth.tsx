import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, Outlet, type RouteObject, RouterProvider } from 'react-router-dom';
import {
  AuthContext,
  type AuthContextValue,
  createAuthContextValue,
} from '../features/auth/auth-context';

type RenderWithAuthOptions = {
  auth?: Partial<AuthContextValue>;
  initialEntries?: string[];
};

export function renderWithAuthRouter(routes: RouteObject[], options: RenderWithAuthOptions = {}) {
  const authValue = createAuthContextValue(options.auth);
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      {
        element: (
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue}>
              <Outlet />
            </AuthContext.Provider>
          </QueryClientProvider>
        ),
        children: routes,
      },
    ],
    {
      initialEntries: options.initialEntries ?? ['/'],
    },
  );

  return {
    ...render(<RouterProvider router={router} />),
    authValue,
    queryClient,
    router,
  };
}
