import { render, screen, waitFor } from '@testing-library/react';
import { refreshAccessToken, setApiAccessToken, setUnauthorizedHandler } from '../../services/api';
import { AuthProvider, useAuth } from './auth-context';

vi.mock('../../services/api', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  refreshAccessToken: vi.fn(),
  setApiAccessToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

function AuthProbe() {
  const auth = useAuth();

  return (
    <div>
      <span>Status: {auth.status}</span>
      <span>User: {auth.user?.email ?? 'none'}</span>
    </div>
  );
}

function buildToken(payload: Record<string, string>) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `header.${encodedPayload}.signature`;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores the session when refresh succeeds', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(
      buildToken({
        sub: 'user-1',
        email: 'admin@fastmeals.com',
        role: 'admin',
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('Status: authenticated')).toBeInTheDocument();
    expect(screen.getByText('User: admin@fastmeals.com')).toBeInTheDocument();
    expect(setApiAccessToken).toHaveBeenCalledWith(expect.any(String));
    expect(setUnauthorizedHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it('falls back to anonymous when refresh fails with a network error', async () => {
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error('network down'));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('Status: anonymous')).toBeInTheDocument();
    expect(screen.getByText('User: none')).toBeInTheDocument();

    await waitFor(() => {
      expect(setApiAccessToken).toHaveBeenCalledWith(null);
    });
  });
});
