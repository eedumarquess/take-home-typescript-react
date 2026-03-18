import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuthRouter } from '../test/render-with-auth';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  it('submits credentials and navigates to the destination route', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue(undefined);

    renderWithAuthRouter(
      [
        {
          path: '/login',
          element: <LoginPage />,
        },
        {
          path: '/dashboard',
          element: <div>Dashboard carregado</div>,
        },
      ],
      {
        auth: {
          signIn,
        },
        initialEntries: ['/login'],
      },
    );

    await user.type(screen.getByLabelText('Email'), 'admin@fastmeals.com');
    await user.type(screen.getByLabelText('Senha'), 'Admin@123');
    await user.click(screen.getByRole('button', { name: 'Acessar painel' }));

    expect(signIn).toHaveBeenCalledWith({
      email: 'admin@fastmeals.com',
      password: 'Admin@123',
    });
    expect(await screen.findByText('Dashboard carregado')).toBeInTheDocument();
  });
});
