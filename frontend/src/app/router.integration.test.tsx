import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { AuthContext, createAuthContextValue } from '../features/auth/auth-context';
import { createAppMemoryRouter } from './router';

describe('app router integration', () => {
  it('redirects anonymous access from a protected route to login', async () => {
    const router = createAppMemoryRouter(['/orders']);

    render(
      <AuthContext.Provider value={createAuthContextValue()}>
        <RouterProvider router={router} />
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Entrar no painel FastMeals.' }),
    ).toBeInTheDocument();
  });
});
