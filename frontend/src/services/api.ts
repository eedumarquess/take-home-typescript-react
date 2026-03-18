const DEFAULT_API_URL = 'http://localhost:3001/api';

type FastMealsErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown[];
  };
};

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(message: string, status: number, code: string, details: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function loginRequest(payload: { email: string; password: string }) {
  return requestJson<{
    accessToken: string;
    user: {
      id: string;
      email: string;
      role: 'admin' | 'viewer';
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuthRefresh: true,
  });
}

export async function logoutRequest() {
  await requestJson<void>('/auth/logout', {
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        accessToken = null;
        return null;
      }

      const payload = (await response.json()) as {
        accessToken: string;
      };

      accessToken = payload.accessToken;
      return payload.accessToken;
    } catch {
      accessToken = null;
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await performRequest(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();

  return (responseText ? (JSON.parse(responseText) as T) : undefined) as T;
}

async function performRequest(path: string, options: RequestOptions) {
  const response = await fetch(buildUrl(path), buildRequestInit(options));

  if (response.status === 401 && !options.skipAuthRefresh && path !== '/auth/refresh') {
    const nextAccessToken = await refreshAccessToken();

    if (nextAccessToken) {
      return fetch(buildUrl(path), buildRequestInit(options));
    }

    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  return response;
}

function buildRequestInit(options: RequestOptions): RequestInit {
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return {
    ...options,
    headers,
    credentials: 'include',
  };
}

async function buildApiError(response: Response) {
  const fallbackMessage = `Request failed with status ${response.status}`;
  const text = await response.text();

  if (!text) {
    return new ApiError(fallbackMessage, response.status, 'UNKNOWN_ERROR', []);
  }

  try {
    const body = JSON.parse(text) as FastMealsErrorResponse;
    const code = body.error?.code ?? 'UNKNOWN_ERROR';
    const message = body.error?.message ?? fallbackMessage;
    const details = Array.isArray(body.error?.details) ? body.error.details : [];

    return new ApiError(message, response.status, code, details);
  } catch {
    return new ApiError(fallbackMessage, response.status, 'UNKNOWN_ERROR', []);
  }
}

function buildUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
