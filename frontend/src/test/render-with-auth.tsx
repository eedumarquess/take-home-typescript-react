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
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthContext.Provider value={authValue}>
            <Outlet />
          </AuthContext.Provider>
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
    router,
  };
}
