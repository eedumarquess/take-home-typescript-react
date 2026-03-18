import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';
import {
  loginRequest,
  logoutRequest,
  refreshAccessToken,
  setApiAccessToken,
  setUnauthorizedHandler,
} from '../../services/api';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
};

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type SignInInput = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const resetSession = useEffectEvent(() => {
    setApiAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setStatus('anonymous');
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const nextAccessToken = await refreshAccessToken();

        if (!nextAccessToken) {
          resetSession();
          return;
        }

        const nextUser = decodeAccessToken(nextAccessToken);

        if (!nextUser) {
          resetSession();
          return;
        }

        setApiAccessToken(nextAccessToken);
        setAccessTokenState(nextAccessToken);
        setUser(nextUser);
        setStatus('authenticated');
      } catch {
        resetSession();
      }
    }

    void bootstrapSession();
  }, []);

  async function signIn(input: SignInInput) {
    const result = await loginRequest(input);

    setApiAccessToken(result.accessToken);
    setAccessTokenState(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
  }

  async function signOut() {
    try {
      await logoutRequest();
    } finally {
      resetSession();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        accessToken,
        isAuthenticated: status === 'authenticated',
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return value;
}

export function createAuthContextValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    status: 'anonymous',
    user: null,
    accessToken: null,
    isAuthenticated: false,
    signIn: async () => undefined,
    signOut: async () => undefined,
    ...overrides,
  };
}

function decodeAccessToken(token: string): AuthUser | null {
  const [, payloadSegment] = token.split('.');

  if (!payloadSegment) {
    return null;
  }

  try {
    const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      '=',
    );
    const payload = JSON.parse(globalThis.atob(paddedPayload)) as {
      sub?: string;
      email?: string;
      role?: string;
    };

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      (payload.role !== 'admin' && payload.role !== 'viewer')
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
